const _ = require('lodash');
const Promise = require('bluebird');
const childProcess = require('child_process');

export class SpawnError extends Error {
  constructor(message, stdout, stderr) {
    super(message);
    this.stdout = stdout;
    this.stderr = stderr;
  }

  toString() {
    return `${this.message}\n${this.stderr}`;
  }
}

/**
 * Executes a child process without limitations on stdout and stderr.
 * On error (exit code is not 0), it rejects with a SpawnProcessError that contains the stdout and stderr streams,
 * on success it returns the streams in an object.
 * @param {string} command - Command
 * @param {string[]} [args] - Arguments
 * @param {Object} [options] - Options for child_process.spawn
 */
export function spawnProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, {
      ...options,
      // nodejs 20 on windows doesn't allow `.cmd` command to run without `shell: true`
      // https://github.com/serverless-heaven/serverless-webpack/issues/1791
      shell: /^win/.test(process.platform),
    });
    let stdout = '';
    let stderr = '';
    // Configure stream encodings
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    // Listen to stream events
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(new SpawnError(`${command} ${_.join(args, ' ')} failed with code ${exitCode}`, stdout, stderr));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
