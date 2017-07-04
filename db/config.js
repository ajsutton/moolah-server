// Path to the migrations directory (relative to migrate)
exports.migration_path = './patches/';

// Which DBMS to use for executing migrations
exports.dbms = 'mysql';

let userConfig = {};
try {
    userConfig = require('../config/config.json').database;
} catch (err) {
    console.debug('No config.js.mine file, continuing.', err);
}
// Configuration for MySQL (username, password, etc.)
exports.mysql = Object.assign({
    user: 'root',
    password: '',
    database: 'moolah',
    charset: 'utf8',
    timezone: 'Z',
    host: 'localhost',
    dateStrings: true,
}, userConfig);