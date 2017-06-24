// Path to the migrations directory (relative to migrate)
exports.migration_path = './patches/';

// Which DBMS to use for executing migrations
exports.dbms = 'mysql';

// Configuration for MySQL (username, password, etc.)
exports.mysql = {
    user: 'root',
    password: '',
    database: 'moolah'
};