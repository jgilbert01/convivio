import fs from 'fs';
import path from 'path';

export const writeFileSync = (filePath, contents) => {
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath));
  }
  return fs.writeFileSync(filePath, JSON.stringify(contents, null, 2));
};
