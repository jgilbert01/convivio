import _ from 'lodash';
import Promise from 'bluebird';
import { join } from 'path';
import fse from 'fs-extra';
import fs from 'fs';

import debug from 'debug';
import { spawnProcess, safeJsonParse, SpawnError } from './utils';

const log = debug('cvo:pack:npm');

export default class NPM {
  static get lockfileName() {
    return 'package-lock.json';
  }

  static get mustCopyModules() {
    return true;
  }

  static copyPackageSectionNames(packagerOptions) {
    const options = packagerOptions || {};
    return options.copyPackageSectionNames || [];
  }

  static getPackagerVersion(cwd) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = ['-v'];

    return spawnProcess(command, args, { cwd })
      .catch((err) => Promise.resolve({ stdout: err.stdout }))
      .then((processOutput) => processOutput.stdout);
  }

  static getProdDependencies(cwd, depth, packagerOptions) {
    // Try to use NPM lockfile v2 when possible
    const options = packagerOptions || {};
    const lockPath = join(cwd, options.lockFile || NPM.lockfileName);
    if (fse.pathExistsSync(lockPath)) {
      const lock = safeJsonParse(fs.readFileSync(lockPath));
      // log(lock);
      if (lock.lockfileVersion === 2) {
        return Promise.resolve(lock);
      }
    }

    // Get first level dependency graph
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = [
      'ls',
      '-prod', // Only prod dependencies
      '-json',
      `-depth=${depth || 1}`,
    ];

    const ignoredNpmErrors = [
      { npmError: 'code ELSPROBLEMS', log: false }, // npm >= 7
      { npmError: 'extraneous', log: false },
      { npmError: 'missing', log: false },
      { npmError: 'peer dep missing', log: true },
    ];

    log(command, args, cwd);
    return spawnProcess(command, args, {
      cwd,
    })
      .catch((err) => {
        if (err instanceof SpawnError) {
          // Only exit with an error if we have critical npm errors for 2nd level inside
          // ignoring any extra output from npm >= 7
          const lines = _.split(err.stderr, '\n');
          const errors = _.takeWhile(lines, (line) => line !== '{');
          const failed = _.reduce(
            errors,
            (failed2, error) => {
              if (failed2) {
                return true;
              }
              return (
                !_.isEmpty(error)
                && !_.some(ignoredNpmErrors, (ignoredError) => _.startsWith(error, `npm ERR! ${ignoredError.npmError}`))
              );
            },
            false,
          );

          if (!failed && !_.isEmpty(err.stdout)) {
            return Promise.resolve({ stdout: err.stdout });
          }
        }

        return Promise.reject(err);
      })
      .then((processOutput) => processOutput.stdout)
      .then((depJson) => Promise.try(() => JSON.parse(depJson)));
  }

  static _rebaseFileReferences(pathToPackageRoot, moduleVersion) {
    if (/^file:[^/]{2}/.test(moduleVersion)) {
      const filePath = _.replace(moduleVersion, /^file:/, '');
      return _.replace(`file:${pathToPackageRoot}/${filePath}`, /\\/g, '/');
    }

    return moduleVersion;
  }

  /**
   * We should not be modifying 'package-lock.json'
   * because this file should be treated as internal to npm.
   *
   * Rebase package-lock is a temporary workaround and must be
   * removed as soon as https://github.com/npm/npm/issues/19183 gets fixed.
   */
  static rebaseLockfile(pathToPackageRoot, lockfile) {
    if (lockfile.version) {
      lockfile.version = NPM._rebaseFileReferences(pathToPackageRoot, lockfile.version);
    }

    if (lockfile.dependencies) {
      _.forIn(lockfile.dependencies, (lockedDependency) => {
        NPM.rebaseLockfile(pathToPackageRoot, lockedDependency);
      });
    }

    return lockfile;
  }

  static install(cwd, packagerOptions) {
    if (packagerOptions.noInstall) {
      return Promise.resolve();
    }

    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = ['install'];

    if (packagerOptions.ignoreScripts) {
      args.push('--ignore-scripts');
    }

    return spawnProcess(command, args, { cwd }).return();
  }

  static prune(cwd) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = ['prune'];

    return spawnProcess(command, args, { cwd }).return();
  }

  static runScripts(cwd, scriptNames) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    return Promise.mapSeries(scriptNames, (scriptName) => {
      const args = ['run', scriptName];

      return spawnProcess(command, args, { cwd });
    }).return();
  }
}
