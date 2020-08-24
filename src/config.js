const Configue = require('configue');
const { v4: uuidv4 } = require('uuid');

module.exports = Configue({
    files: [
        {file: __dirname + '/../config/config.json'},
    ],
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
                levels: {
                },
            },
        },
    },
});