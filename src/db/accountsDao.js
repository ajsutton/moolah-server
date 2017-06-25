const db = require('./database');

module.exports = {
    accounts() {
        return db.query('SELECT id, name, type, balance FROM account');
    }
};