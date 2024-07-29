import fs from 'fs';
import archiver from 'archiver';
import Promise from 'bluebird';
import debug from 'debug';

const log = debug('cvo:pack');

export const pack = ({ artifactFilePath, directory }) => {
    const zip = archiver.create('zip');
    const output = fs.createWriteStream(artifactFilePath);

    log(directory, artifactFilePath);

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(artifactFilePath));
      output.on('error', err => reject(err));
      zip.on('error', err => reject(err));
  
      output.on('open', () => {
        zip.pipe(output);
        zip.glob('**', {
            cwd: directory,
            dot: true,
            silent: true,
            follow: true,
            nodir: true
          })
        zip.finalize();
      });
    });
};