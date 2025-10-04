# @convivio/cli

This module provides the CLI for [@Convivio](https://github.com/jgilbert01/convivio), which is a drop in replacement for the Serverless Framework (SF) v3.

## install

```
$ npm install @convivio/cli -D
```

## Configuration

TODO

## Logging
DEBUG=cvo:*

## Commands

```
$ cvo --help
Usage: cvo [options] [command]

Options:
  -V, --version        output the version number
  -s, --stage <char>
  -r, --region <char>
  -h, --help           display help for command

Commands:
  start
  package
  deploy [options]
  print
  help [command]       display help for command
```

### cvo package -r us-west-2 -s dev

Process the yml, generate the code and zip the distribution.
Useful for testing your yml.

```
$ cvo package -h 
Usage: cvo package [options]

Options:
  -h, --help  display help for command

```


### cvo start -r us-west-2 -s dev

Start the webpack dev server for integration testing.

```
$ cvo start -h
Usage: cvo start [options]

Options:
  -h, --help  display help for command
```

### cvo deploy -r us-west-2 -s dev --dryrun

Process the yml, generate the code, zip the distribution and deploy the stack.
Use the --dryrun option to generate a changeset.

```
$ cvo deploy -h 
Usage: cvo deploy [options]

Options:
  --dryrun
  -h, --help  display help for command
```

