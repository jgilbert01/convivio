import debug from 'debug';

const log = debug('cvo:parse:parse');

export const parse = async (value, resolvers) => {
  const stack = [{ result: [] }];
  const setter = ['result'];
  let variable;
  let src;

  for (let i = 0; i < value.length; i++) { // eslint-disable-line no-plusplus
    let c = value[i];
    // console.log('%j', { c, stack });
    switch (c) {
      case '$':
        if (value[i + 1] === '{') {
          stack.push({
            src: [],
            param: [],
            address: [],
            defaultValue: [],
          });

          setter.push('src');
          i++; // eslint-disable-line no-plusplus
          break;
        }
      case '(':
        if (setter[setter.length - 1] === 'src') {
          setter[setter.length - 1] = 'param';
          break;
        }
      case ')':
        if (setter[setter.length - 1] === 'param') {
          break;
        }
      case ':':
        if (setter[setter.length - 1] === 'src'
          || setter[setter.length - 1] === 'param') {
          setter[setter.length - 1] = 'address';
          break;
        }
      case ',':
        if (setter[setter.length - 1] === 'address') {
          setter[setter.length - 1] = 'defaultValue';
          while (value[i + 1] === ' ') i++; // eslint-disable-line no-plusplus
          break;
        }
      case '}':
        if (stack.length > 1) {
          setter.pop();
          variable = stack.pop();

          variable.src = variable.src.join('');
          variable.param = variable.param.join('');
          variable.address = variable.address.join('');
          variable.defaultValue = variable.defaultValue.join('');
          log('%j', { variable });

          src = resolvers[variable.src];
          if (!src) {
            throw new Error(`Unknown variable source: ${variable.src}`);
          }

          if (!variable.address.includes('${')) {
            c = await src(variable, resolvers); // eslint-disable-line no-await-in-loop
          } else {
            c = undefined;
          }

          if (!c) { // prepare for pass 2
            c = `\$\{${variable.src}`;
            if (variable.param) {
              c = `${c}(${variable.param})`;
            }
            if (variable.address) {
              c = `${c}:${variable.address}`;
            }
            if (variable.defaultValue) {
              c = `${c}, ${variable.defaultValue}`;
            }
            c = `${c}\}`;
            // log('%j', { c });
          }
        }
      default:
        stack[stack.length - 1][setter[setter.length - 1]].push(c);
    }
  }

  log('%j', { stack: stack[0].result[0] });
  if (typeof stack[0].result[0] === 'string') {
    return stack[0].result.join(''); // string
  } else {
    return stack[0].result[0]; // object
  }
};
