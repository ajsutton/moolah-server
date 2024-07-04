import Configue from 'configue';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default Configue({
  files: [{ file: __dirname + '/../config/config.json' }],
  defaults: {
    https: true,
    authentication: {
      secureToken: uuidv4(),
      googleClientId: 'invalid',
      clientSecret: 'invalid',
    },
    database: {
      user: 'root',
      password: '',
      database: 'moolah',
      charset: 'utf8',
      timezone: 'Z',
      host: 'localhost',
      dateStrings: true,
      connectionLimit: 50,
    },
    logging: {
      console: {
        enabled: true,
        levels: {
          response: '*',
          log: '*',
          error: '*',
        },
      },
      file: {
        enabled: false,
        path: 'moolah.log',
        levels: {},
      },
    },
  },
});
