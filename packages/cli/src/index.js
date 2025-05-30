#!/usr/bin/env node
import { Command } from 'commander';
import Convivio from './convivio';

const program = new Command();

// const main = new Convivio(options);

// https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk/README.md
// boostrap - CDKToolKit = template-pipeline-resources

program
  // .name('cvo')
  .version(require('../package.json').version)
  .option('-s, --stage <char>')
  .option('-r, --region <char>');
// package path ???
// .option('-c, --config <path>', 'set config path', 'convivio.config.js');

// TODO verbose, force, package, param?
// offline/start, remove, logs, init
// profile, login w mfa - aws-get-session-token
// jobs ???

program
  .command('start')
  .action(async () => {
    const options = program.opts();
    const main = new Convivio(options);
    await main.start();
  });

program
  .command('package')
  .action(async () => {
    const options = program.opts();
    const main = new Convivio(options);
    await main.package();
  });

program
  .command('deploy')
  .option('--dryrun')
  .action(async (options) => {
    const main = new Convivio({ ...program.opts(), ...options });
    await main.deploy();
  });

program
  .command('print')
  .action(async () => {
    const options = program.opts();
    const main = new Convivio(options);
    await main.print();
  });

program.parseAsync(process.argv)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
