import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { flatten } from 'lodash';
import debug from 'debug';

const log = debug('cvo:parse:yaml');

export const load = (basedir, filename) => {
  try {
    const filepath = path.resolve(basedir, filename);
    const content = yaml.load(fs.readFileSync(filepath, 'utf8'), {
      filename: filepath,
      schema: cloudformationSchema,
    });
    log('%j', { content });
    return content;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const functionNames = [
  'And',
  'Base64',
  'Cidr',
  'Condition',
  'Equals',
  'FindInMap',
  'GetAtt',
  'GetAZs',
  'If',
  'ImportValue',
  'Join',
  'Not',
  'Or',
  'Ref',
  'Select',
  'Split',
  'Sub',
];

const yamlType = (name, kind) => {
  const functionName = ['Ref', 'Condition'].includes(name) ? name : `Fn::${name}`;
  return new yaml.Type(`!${name}`, {
    kind,
    construct: (data) => {
      if (name === 'GetAtt') {
        // special GetAtt dot syntax
        if (typeof data === 'string') {
          const [first, ...tail] = data.split('.');
          data = [first, tail.join('.')];
        }
      }
      return { [functionName]: data };
    },
  });
};

const createSchema = () => {
  const types = flatten(
    functionNames.map((functionName) =>
      ['mapping', 'scalar', 'sequence'].map((kind) => yamlType(functionName, kind))),
  );
    //   console.log('types: ', JSON.stringify(types, null, 2));

  return yaml.DEFAULT_SCHEMA.extend(types);
};

const cloudformationSchema = createSchema();
