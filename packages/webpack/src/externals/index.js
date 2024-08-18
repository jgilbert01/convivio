import Promise from 'bluebird';
import _ from 'lodash';
import path from 'path';
import fse from 'fs-extra';
import fs from 'fs';
import jc from 'json-cycle';
import debug from 'debug';
import isBuiltinModule from 'is-builtin-module';

import npm from './npm';

const log = debug('cvo:pack:ext');

function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
  if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
    const filePath = _.replace(moduleVersion, /^file:/, '');
    return _.replace(
      `${_.startsWith(moduleVersion, 'file:') ? 'file:' : ''}${pathToPackageRoot}/${filePath}`,
      /\\/g,
      '/'
    );
  }

  return moduleVersion;
};

/**
 * Add the given modules to a package json's dependencies.
 */
function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) {
  _.forEach(externalModules.sort(), externalModule => {
    const splitModule = _.split(externalModule, '@');
    // If we have a scoped module we have to re-add the @
    if (_.startsWith(externalModule, '@')) {
      splitModule.splice(0, 1);
      splitModule[0] = '@' + splitModule[0];
    }
    let moduleVersion = _.join(_.tail(splitModule), '@');
    // We have to rebase file references to the target package.json
    moduleVersion = rebaseFileReferences(pathToPackageRoot, moduleVersion);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies[_.first(splitModule)] = moduleVersion;
  });
};

/**
 * Remove a given list of excluded modules from a module list
 * @this - The active plugin instance
 */
function removeExcludedModules(modules, packageForceExcludes) {
  const excludedModules = _.remove(modules, externalModule => {
    const splitModule = _.split(externalModule, '@');
    // If we have a scoped module we have to re-add the @
    if (_.startsWith(externalModule, '@')) {
      splitModule.splice(0, 1);
      splitModule[0] = '@' + splitModule[0];
    }
    const moduleName = _.first(splitModule);
    return _.includes(packageForceExcludes, moduleName);
  });

  log('excludedModules: ', excludedModules);
};

/**
 * Resolve the needed versions of production dependencies for external modules.
 * @this - The active plugin instance
 */
function getProdModules(externalModules, packagePath, nodeModulesRelativeDir, dependencyGraph, forceExcludes) {
  const packageJsonPath = path.join(process.cwd(), packagePath);
  const packageJson = require(packageJsonPath);
  const prodModules = [];

  // only process the module stated in dependencies section
  if (!packageJson.dependencies) {
    return [];
  }

  log('externalModules: ', externalModules);

  // Get versions of all transient modules
  _.forEach(externalModules, module => {
    let moduleVersion = packageJson.dependencies[module.external];

    if (moduleVersion) {
      prodModules.push(`${module.external}@${moduleVersion}`);

      let nodeModulesBase = path.join(path.dirname(path.join(process.cwd(), packagePath)), 'node_modules');

      if (nodeModulesRelativeDir) {
        const customNodeModulesDir = path.join(process.cwd(), nodeModulesRelativeDir, 'node_modules');

        if (fse.pathExistsSync(customNodeModulesDir)) {
          nodeModulesBase = customNodeModulesDir;
        } else {
          log(`WARNING: ${customNodeModulesDir} dose not exist. Please check nodeModulesRelativeDir setting`);
        }
      }

      // Check if the module has any peer dependencies and include them too
      try {
        const modulePackagePath = path.join(nodeModulesBase, module.external, 'package.json');

        const peerDependencies = require(modulePackagePath).peerDependencies;
        if (!_.isEmpty(peerDependencies)) {
          log(`Adding explicit peers for dependency ${module.external}`);

          const peerDependenciesMeta = require(modulePackagePath).peerDependenciesMeta;

          if (!_.isEmpty(peerDependenciesMeta)) {
            _.forEach(peerDependencies, (value, key) => {
              if (peerDependenciesMeta[key] && peerDependenciesMeta[key].optional === true) {
                log(`Skipping peers dependency ${key} for dependency ${module.external} because it's optional`);
                _.unset(peerDependencies, key);
              }
            });
          }

          if (!_.isEmpty(peerDependencies)) {
            const peerModules = getProdModules.call(
              this,
              _.map(peerDependencies, (value, key) => ({ external: key })),
              packagePath,
              nodeModulesRelativeDir,
              dependencyGraph,
              forceExcludes
            );
            Array.prototype.push.apply(prodModules, peerModules);
          }
        }
      } catch (e) {
        log(`WARNING: Could not check for peer dependencies of ${module.external}. Set nodeModulesRelativeDir if node_modules is in different directory.`);
      }
    } else {
      if (!packageJson.devDependencies || !packageJson.devDependencies[module.external]) {
        // Add transient dependencies if they appear not in the service's dev dependencies
        const originInfo = _.get(dependencyGraph, 'dependencies', {})[module.origin] || {};
        moduleVersion = _.get(_.get(originInfo, 'dependencies', {})[module.external], 'version');
        if (!moduleVersion) {
          moduleVersion = _.get(dependencyGraph, ['dependencies', module.external, 'version']);
        }
        if (!moduleVersion) {
          log(`WARNING: Could not determine version of module ${module.external}`);
        }
        prodModules.push(moduleVersion ? `${module.external}@${moduleVersion}` : module.external);
      } else if (
        packageJson.devDependencies &&
        packageJson.devDependencies[module.external] &&
        !_.includes(forceExcludes, module.external)
      ) {
        // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
        // most likely set in devDependencies and should not lead to an error now.
        const ignoredDevDependencies = ['aws-sdk', '@aws-sdk'];

        if (!ignoredDevDependencies.some((dev) => module.external.startsWith(dep))) {
          // Runtime dependency found in devDependencies but not forcefully excluded
          log(
            `ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`
          );
          throw new Error(`webpack dependency error: ${module.external}.`);
        }
        log(
          `INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`
        );
      }
    }
  });

  return prodModules;
};

function writeFileSync(filePath, contents) {
  fse.mkdirsSync(path.dirname(filePath));
  return fse.writeFileSync(filePath, contents);
};

/**
 * We need a performant algorithm to install the packages for each single
 * function (in case we package individually).
 * (1) We fetch ALL packages needed by ALL functions in a first step
 * and use this as a base npm checkout. The checkout will be done to a
 * separate temporary directory with a package.json that contains everything.
 * (2) For each single compile we copy the whole node_modules to the compile
 * directory and create a (function) compile specific package.json and store
 * it in the compile directory. Now we start npm again there, and npm will just
 * remove the superfluous packages and optimize the remaining dependencies.
 * This will utilize the npm cache at its best and give us the needed results
 * and performance.
 */
export const packExternalModules = (service, configuration) => (params) => {
  // log('configuration: %j', configuration);
  // log('params: %j', params);

  const stats = { stats: params.stats };

  const includes = configuration.includeModules;

  log('Packing external modules');

  // Read plugin configuration
  const packageForceIncludes = _.get(includes, 'forceInclude', []);
  const packageForceExcludes = _.get(includes, 'forceExclude', []);
  const packagePath = includes.packagePath || './package.json';
  const nodeModulesRelativeDir = includes.nodeModulesRelativeDir;
  const packageJsonPath = path.join(process.cwd(), packagePath);
  const packageScripts = _.reduce(
    [],
    (__, script, index) => {
      __[`script${index}`] = script;
      return __;
    },
    {}
  );

  // Determine and create packager
  return Promise.try(() => {
    // Fetch needed original package.json sections
    const sectionNames = npm.copyPackageSectionNames(); // this.configuration.packagerOptions
    // log(sectionNames);
    const packageJson = jc.parse(fs.readFileSync(packageJsonPath));
    const packageSections = _.pick(packageJson, sectionNames);
    if (!_.isEmpty(packageSections)) {
      log(`Using package.json sections ${_.join(_.keys(packageSections), ', ')}`);
    }

    // Get first level dependency graph
    log(`Fetch dependency graph from ${packageJsonPath}`);

    return npm
      .getProdDependencies(path.dirname(packageJsonPath), 1, {}) // this.configuration.packagerOptions
      .then(dependencyGraph => {
        // log(dependencyGraph);
        const problems = _.get(dependencyGraph, 'problems', []);
        if (!_.isEmpty(problems)) {
          log(`Ignoring ${_.size(problems)} NPM errors:`);
          _.forEach(problems, problem => {
            log(`=> ${problem}`);
          });
        }
        // log('stats.stats: ', stats.stats);

        // (1) Generate dependency composition
        const compositeModules = _.uniq(
          _.flatMap(stats.stats, compileStats => {
            // log('compileStats: ', compileStats);
            // log('compileStats.externalModules: ', compileStats.externalModules);
            // log('packageForceIncludes: ', packageForceIncludes);
            const externalModules = _.concat(
              compileStats.externalModules ?? [],
              _.map(packageForceIncludes, whitelistedPackage => ({
                external: whitelistedPackage
              }))
            );
            return getProdModules.call(
              this,
              externalModules,
              packagePath,
              nodeModulesRelativeDir,
              dependencyGraph,
              packageForceExcludes
            );
          })
        );
        // log(compositeModules);
        removeExcludedModules.call(this, compositeModules, packageForceExcludes);

        if (_.isEmpty(compositeModules)) {
          // The compiled code does not reference any external modules at all
          log('No external modules needed');
          return Promise.resolve();
        }

        // (1.a) Install all needed modules
        const compositeModulePath = path.join(process.cwd(), '.webpack', 'dependencies');
        const compositePackageJson = path.join(compositeModulePath, 'package.json');

        // (1.a.1) Create a package.json
        const compositePackage = _.defaults(
          {
            name: service,
            version: '1.0.0',
            description: `Packaged externals for ${service}`,
            private: true,
            scripts: packageScripts
          },
          packageSections
        );
        const relPath = path.relative(compositeModulePath, path.dirname(packageJsonPath));
        addModulesToPackageJson(compositeModules, compositePackage, relPath);
        writeFileSync(compositePackageJson, JSON.stringify(compositePackage, null, 2));

        // (1.a.2) Copy package-lock.json if it exists, to prevent unwanted upgrades
        const packagerOptions = {};
        const packageLockPath = path.join(
          path.dirname(packageJsonPath),
          packagerOptions.lockFile || npm.lockfileName
        );
        let hasPackageLock = false;
        return Promise.fromCallback(cb => fse.pathExists(packageLockPath, cb))
          .then(exists => {
            if (exists) {
              log('Package lock found - Using locked versions');
              try {
                let packageLockFile = fs.readFileSync(packageLockPath);
                packageLockFile = npm.rebaseLockfile(relPath, packageLockFile);
                if (_.isObject(packageLockFile)) {
                  packageLockFile = JSON.stringify(packageLockFile, null, 2);
                }

                writeFileSync(
                  path.join(compositeModulePath, npm.lockfileName),
                  packageLockFile
                );
                hasPackageLock = true;
              } catch (err) {
                log(`WARNING: Could not read lock file: ${err.message}`);
              }
            }
            return Promise.resolve();
          })
          .then(() => {
            const start = _.now();
            log('Packing external modules: ' + compositeModules.join(', '));

            return npm.getPackagerVersion(compositeModulePath).then(version => {
              return npm
                .install(compositeModulePath, {}, version) // this.configuration.packagerOptions
                .then(() => {
                  log(`Package took [${_.now() - start} ms]`);
                  return null;
                })
                .return(stats.stats);
            });
          })
          .mapSeries(compileStats => {
            const modulePath = compileStats.outputPath;
            // log('modulePath: ', modulePath);
            // log('compileStats: ', compileStats);

            // Create package.json
            const modulePackageJson = path.join(modulePath, 'package.json');
            const modulePackage = _.defaults(
              {
                name: service,
                version: '1.0.0',
                description: `Packaged externals for ${service}`,
                private: true,
                scripts: packageScripts,
                dependencies: {}
              },
              packageSections
            );
            const prodModules = getProdModules.call(
              this,
              _.concat(
                compileStats.externalModules,
                _.map(packageForceIncludes, whitelistedPackage => ({
                  external: whitelistedPackage
                }))
              ),
              packagePath,
              nodeModulesRelativeDir,
              dependencyGraph,
              packageForceExcludes
            );
            removeExcludedModules.call(this, prodModules, packageForceExcludes);
            const relPath = path.relative(modulePath, path.dirname(packageJsonPath));
            addModulesToPackageJson(prodModules, modulePackage, relPath);
            writeFileSync(modulePackageJson, JSON.stringify(modulePackage, null, 2));

            const startCopy = _.now();
            return Promise.try(() => {
              // Only copy dependency modules if demanded by packager
              if (npm.mustCopyModules) {
                return Promise.fromCallback(callback =>
                  fse.copy(
                    path.join(compositeModulePath, 'node_modules'),
                    path.join(modulePath, 'node_modules'),
                    callback
                  )
                );
              }
              return Promise.resolve();
            })
              .then(() =>
                hasPackageLock
                  ? Promise.fromCallback(callback =>
                    fse.copy(
                      path.join(compositeModulePath, npm.lockfileName),
                      path.join(modulePath, npm.lockfileName),
                      callback
                    )
                  )
                  : Promise.resolve()
              )
              .tap(() => {
                log(`Copy modules: ${modulePath} [${_.now() - startCopy} ms]`);
              })
              .then(() => {
                // Prune extraneous packages - removes not needed ones
                const startPrune = _.now();
                return npm.getPackagerVersion(modulePath).then(version => {
                  return npm.prune(modulePath, {}, version).tap(() => { // this.configuration.packagerOptions
                    log(`Prune: ${modulePath} [${_.now() - startPrune} ms]`);
                  });
                });
              })
              .then(() => {
                // Prune extraneous packages - removes not needed ones
                const startRunScripts = _.now();
                return npm.runScripts(modulePath, _.keys(packageScripts)).tap(() => {
                  log(`Run scripts: ${modulePath} [${_.now() - startRunScripts} ms]`);
                });
              });
          })
          .return();
      });
  });
};

export const getExternalModules = ({ compilation }) => {
  const externals = new Set();
  for (const module of compilation.modules) {
    if (isExternalModule(module) && isUsedExports(compilation.moduleGraph, module)) {
      externals.add({
        origin: _.get(
          findExternalOrigin(compilation.moduleGraph, getIssuerCompat(compilation.moduleGraph, module)),
          'rawRequest'
        ),
        external: getExternalModuleName(module)
      });
    }
  }
  return Array.from(externals);
};

const getExternalModuleName = (module) => {
  const pathArray = /^external .*"(.*?)"$/.exec(module.identifier());
  if (!pathArray) {
    throw new Error(`Unable to extract module name from Webpack identifier: ${module.identifier()}`);
  }

  const path = pathArray[1];
  const pathComponents = path.split('/');
  const main = pathComponents[0];

  // this is a package within a namespace
  if (main.charAt(0) == '@') {
    return `${main}/${pathComponents[1]}`;
  }

  return main;
};

const isExternalModule = (module) => {
  return _.startsWith(module.identifier(), 'external ') && !isBuiltinModule(getExternalModuleName(module));
};

/**
 * Gets the module issuer. The ModuleGraph api does not exists in webpack@4
 * so falls back to using module.issuer.
 */
const getIssuerCompat = (moduleGraph, module) => {
  if (moduleGraph) {
    return moduleGraph.getIssuer(module);
  }

  return module.issuer;
};

/**
 * Find if module exports are used. The ModuleGraph api does not exists in webpack@4
 * so falls back to using module.issuer
 * @param {Object} moduleGraph - Webpack module graph
 * @param {Object} module - Module
 */
const getUsedExportsCompat = (moduleGraph, module) => {
  if (moduleGraph) {
    return moduleGraph.getUsedExports(module);
  }

  return module.usedExports;
};

/**
 * Find the original module that required the transient dependency. Returns
 * undefined if the module is a first level dependency.
 * @param {Object} moduleGraph - Webpack module graph
 * @param {Object} issuer - Module issuer
 */
const findExternalOrigin = (moduleGraph, issuer) => {
  if (!_.isNil(issuer) && _.startsWith(issuer.rawRequest, './')) {
    return findExternalOrigin(moduleGraph, getIssuerCompat(moduleGraph, issuer));
  }
  return issuer;
};

const isUsedExports = (moduleGraph, module) => {
  // set of used exports, or true (when namespace object is used), or false (when unused), or null (when unknown)
  // @see https://github.com/webpack/webpack/blob/896efde07d775043765a300961c8b932349254bb/lib/ExportsInfo.js#L463-L466
  const usedExports = getUsedExportsCompat(moduleGraph, module);

  // Only returns false when unused
  return usedExports !== false;
};
