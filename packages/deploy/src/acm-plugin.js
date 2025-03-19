import debug from 'debug';

import { factory } from '@convivio/connectors';

const log = debug('cvo:acm:plugin');

export class CertificateManagerPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    if (cvo.yaml.custom.acm) {
      cvo.hooks.predeploy.tapPromise(CertificateManagerPlugin.name, importCert);
    }
  }
}

let imported = false;

const importCert = async (convivio) => {
  log('%j', { convivio });

  if (imported) return;

  try {
    const config = convivio.yaml.custom.acm;

    if (
      config.certs === undefined ||
      config.certs.length === 0
    ) {
      console.log('acm-import-plugin: certs not defined. Skipping certificate import.');
      return;
    }

    const certs = config.certs === false ? [] : config.certs
      .filter((cert) => {
        // console.log('cert config: ', JSON.stringify(cert, null, 2));
        if (cert.name === undefined) {
          console.log('serverless-acm-import-plugin: missing cert name: ', cert.certVar);
          return false;
        }
        if (process.env[cert.certVar] === undefined) {
          console.log('acm-import-plugin: missing cert env variable: ', cert.certVar);
          return false;
        }
        if (process.env[cert.keyVar] === undefined) {
          console.log('acm-import-plugin: missing key env variable: ', cert.keyVar);
          return false;
        }
        if (process.env[cert.chainVar] === undefined) {
          console.log('acm-import-plugin: missing chain env variable: ', cert.chainVar);
          return false;
        }
        return true;
      });

    const connector = factory(convivio.config.credentials, convivio.options.region, 'CertificateManager');

    return Promise.all(certs.map((cert) => {
      const findCert = () => {
        if (cert.arn && cert.arn !== 'UNDEFINED') {
          return connector.getCertificate({
            CertificateArn: cert.arn,
          })
            .then((data) => ({
              CertificateArn: cert.arn,
              ...data,
            }));
        } else {
          return Promise.resolve('not-found');
        }
      };
   
      return findCert()
        .then((data) => {
          // console.log('find: ', data);
   
          if (data === 'not-found') return {};
   
          if (data.Certificate !== process.env[cert.certVar]) {
            // console.log('cert is diff')
            return data;
          }
   
          if (data.CertificateChain !== process.env[cert.chainVar]) {
            // console.log('ca is diff')
            return data;
          }
   
          return false;
        })
        .then((importCert) => {
          // console.log('importCert: ', importCert);
          if (importCert) {
            const params = {
              CertificateArn: importCert.CertificateArn,
              Certificate: process.env[cert.certVar],
              PrivateKey: process.env[cert.keyVar],
              CertificateChain: process.env[cert.chainVar],
              // Tags: !importCert.CertificateArn ? [
              //   {
              //     Key: 'name',
              //     Value: cert.name
              //   },
              // ] : undefined,
            };
   
            // console.log('params: ', params);
   
            return connector.importCertificate(params)
              .then((data) => {
                console.log('Certificate ARN: %j', data.CertificateArn);
                // throw new Error('TESTING - STOP');
              });
          }
        });
    }));
  } catch (err) {
    console.log(err);
  }
};
