const db = require('./database');

module.exports = {
    accounts() {
        return db.query('SELECT id, name, type, balance FROM account');
    },

    store(account) {
        return db.query(
            'INSERT INTO account (id, name, type, balance) VALUES (?, ?, ?, ?) ' +
            'ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), balance = VALUES(balance)',
            account.id, account.name, account.type, account.balance);
    },
};