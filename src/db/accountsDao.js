const db = require('./database');

module.exports = {
    accounts() {
        return db.query('SELECT id, name, type, balance FROM account');
    },

    async account(id) {
        const results = await db.query('SELECT id, name, type, balance FROM account WHERE id = ?', id);
        return results[0];
    },

    create(account) {
        return db.query(
            'INSERT INTO account (id, name, type, balance) VALUES (?, ?, ?, ?)',
            account.id, account.name, account.type, account.balance,
        );
    },

    store(account) {
        return db.query(
            'UPDATE account SET name = ?, type = ?, balance = ? WHERE id = ?',
            account.name, account.type, account.balance, account.id);
    },
};