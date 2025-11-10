import _ from 'lodash';
import glob from 'glob-all';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import mime from 'mime-types';
import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:s3-deploy:plugin');

const DEFAULT_FILES = {
  source: './dist',
  globs: '**/*', // index.html
  defaultContentType: 'application/octet-stream',
  headers: {
    // CacheControl: 'max-age=300' // 5 minutes
    // CacheControl: 'max-age=86400' // 1 day
    // CacheControl: 'max-age=31536000' // 1 year
  },
};

// "dp:dev:w": "s3-deploy './dist/**' --cwd './dist/' --region us-west-2 --bucket my-app-dev-us-west-2 --cache 31536000 --private --gzip js,map",

// s3Deploy:
//   websiteBucketName: my-subsys-main-${opt:stage}
//   acl: private
//   files:
//     - source: ./dist
//       # globs: '**/[!index]*'
//       globs: '**/*'
//       headers:
//         CacheControl: max-age=31536000,immutable # 1 year
//     - source: ./dist
//       globs: index.html
//       key: index.html
//       headers:
//         CacheControl: max-age=300 # 5 minutes
//     - source: ./dist
//       globs: service-worker.js
//       key: service-worker.js
//       headers:
//         CacheControl: max-age=300 # 5 minutes
//     - source: ./dist
//       globs: service-worker.js.map
//       key: service-worker.js.map
//       headers:
//         CacheControl: max-age=300 # 5 minutes
//     - source: ./dist
//       globs: public/manifest.json
//       key: manifest.json
//       headers:
//         CacheControl: max-age=300 # 5 minutes
//         ContentType: application/json; charset=UTF-8
//     - source: ./dist
//       globs: manifest.json
//       key: manifest.json
//       headers:
//         CacheControl: max-age=300 # 5 minutes
//         ContentType: application/json; charset=UTF-8

export class S3DeployPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.predeploy.tapPromise(S3DeployPlugin.name, deploy);
  }
}

const deploy = async (convivio) => {
  log('%j', { convivio });

  if (!convivio.yaml.custom?.s3Deploy) return;

  try {
    const config = {
      // websiteBucketName # REQUIRED
      // defaults
      prefix: '',
      acl: 'private',
      gzip: ['js', 'map'],
      files: [
        DEFAULT_FILES,
      ],
      ...convivio.yaml.custom.s3Deploy,
    };

    log('config: %j', config);

    if (
      config.websiteBucketName === undefined
            || config.websiteBucketName.length === 0
    ) {
      console.log('s3-deploy-plugin: bucket not defined. Skipping s3 deploy.');
      return;
    }

    const connector = factory(convivio.config.credentials, convivio.options.region, 'S3');

    return Promise.resolve()
      .then(() =>
        Promise.all(
          config.files.map((files) => {
            const opt = { ...DEFAULT_FILES, ...files };

            log(`Path: ${opt.source}`);

            return Promise.all(
              glob.sync(opt.globs, { nodir: true, cwd: opt.source })
                .map((filename) => {
                  const body = fs.readFileSync(path.join(opt.source, filename));
                  const ext = filename.split('.').pop();
                  const type = opt.headers.ContentType || mime.lookup(filename) || opt.defaultContentType;
                  const key = opt.key || path.posix.join(config.prefix, filename);

                  log(`File: ${filename} (${type}) (${ext})`);

                  const params = {
                    ACL: config.acl,
                    Body: (config.gzip && config.gzip.includes(ext)) ? zlib.gzipSync(body) : body,
                    Bucket: config.websiteBucketName,
                    Key: key,
                    ContentType: type,
                    ContentEncoding: (config.gzip && config.gzip.includes(ext)) ? 'gzip' : undefined,
                    ...opt.headers,
                  };

                  // console.log('params: %j', _.omit(params, 'Body'));

                  return connector.putObject(params);
                }),
            );
          }),
        ));
  } catch (err) {
    console.log(err);
  }
};

// const removeObjects = (serverless) => {
//   const config = Object.assign(
//     {},
//     {
//       websiteBucketNameOutputRef: 'WebsiteBucketName',
//     },
//     (serverless.service.custom && serverless.service.custom.spa) || {}
//   );

//   return Promise.resolve()
//     .then(() => getWebsiteBucketName(serverless, config))
//     .then((websiteBucketName) => {
//       // console.log('websiteBucketName: %j', websiteBucketName);

//       const removeObjects = (nextContinuationToken) => {
//         const params = {
//           Bucket: websiteBucketName,
//           // MaxKeys: 3, // to test recursion
//           ContinuationToken: nextContinuationToken,
//         };

//         const provider = serverless.getProvider('aws');

//         return provider.request('S3', 'listObjectsV2', params)
//           .then((data) => {
//             return {
//               nextContinuationToken: data.NextContinuationToken,
//               params: data.Contents.reduce(
//                 (params, current) => {
//                   params.Delete.Objects.push({
//                     Key: current.Key
//                   });
//                   return params;
//                 },
//                 {
//                   Bucket: websiteBucketName,
//                   Delete: {
//                     Objects: []
//                   }
//                 }
//               ),
//             };
//           })
//           .then((uow) => {
//             // console.log('uow: %j', uow);

//             if (uow.params.Delete.Objects.length > 0) {
//               return provider.request('S3', 'deleteObjects', uow.params)
//                 .then((data) => {
//                   data.Deleted.forEach((file) => log(`Removed: ${file.Key}`));

//                   // recurse
//                   if (uow.nextContinuationToken) {
//                     // console.log('nextContinuationToken: %j', uow.nextContinuationToken);
//                     return removeObjects(uow.nextContinuationToken);
//                   }
//                 });
//             }
//           });
//       };

//       return removeObjects();
//     });
// };

// const removeVersions = (serverless) => {
//   const config = Object.assign(
//     {},
//     {
//       websiteBucketNameOutputRef: 'WebsiteBucketName',
//     },
//     (serverless.service.custom && serverless.service.custom.spa) || {}
//   );

//   return Promise.resolve()
//     .then(() => getWebsiteBucketName(serverless, config))
//     .then((websiteBucketName) => {
//       // console.log('websiteBucketName: %j', websiteBucketName);

//       const removeVersions = (nextKeyMarker, nextVersionIdMarker) => {
//         const params = {
//           Bucket: websiteBucketName,
//           MaxKeys: 500,
//           KeyMarker: nextKeyMarker,
//           VersionIdMarker: nextVersionIdMarker
//         };

//         const provider = serverless.getProvider('aws');

//         return provider.request('S3', 'listObjectVersions', params)
//           .then((data) => {
//             let params = data.Versions.reduce(
//               (params, current) => {
//                 params.Delete.Objects.push({
//                   Key: current.Key,
//                   VersionId: current.VersionId
//                 });
//                 return params;
//               },
//               {
//                 Bucket: websiteBucketName,
//                 Delete: {
//                   Objects: []
//                 }
//               }
//             );

//             params = data.DeleteMarkers.reduce((params, current) => {
//               params.Delete.Objects.push({
//                 Key: current.Key,
//                 VersionId: current.VersionId
//               });
//               return params;
//             }, params);

//             return {
//               nextKeyMarker: data.NextKeyMarker,
//               nextVersionIdMarker: data.NextVersionIdMarker,
//               params: params,
//             };
//           })
//           .then((uow) => {
//             // console.log('uow: %j', uow);

//             if (uow.params.Delete.Objects.length > 0) {
//               return provider.request('S3', 'deleteObjects', uow.params)
//                 .then((data) => {
//                   data.Deleted.forEach((file) => log(`Removed: ${file.Key} - ${file.VersionId}`));

//                   // recurse
//                   if (uow.nextKeyMarker || uow.nextVersionIdMarker) {
//                     // console.log('nextKeyMarker: %j', uow.nextKeyMarker);
//                     // console.log('nextVersionIdMarker: %j', uow.nextVersionIdMarker);
//                     return removeVersions(uow.nextKeyMarker, uow.nextVersionIdMarker);
//                   }
//                 });
//             }
//           });
//       };

//       return removeVersions();
//     });
// };
