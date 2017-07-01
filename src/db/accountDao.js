const db = require('./database');

module.exports = {
    accounts(userId) {
        return db.query('SELECT id, name, type, balance FROM account WHERE user_id = ?', userId);
    },

    async account(userId, id) {
        const results = await db.query('SELECT id, name, type, balance FROM account WHERE user_id = ? AND id = ?', userId, id);
        return results[0];
    },

    create(userId, account) {
        return db.query(
            'INSERT INTO account (user_id, id, name, type, balance) VALUES (?, ?, ?, ?, ?)',
            userId, account.id, account.name, account.type, account.balance,
        );
    },

    store(userId, account) {
        return db.query(
            'UPDATE account SET name = ?, type = ?, balance = ? WHERE user_id = ? AND id = ?',
            account.name, account.type, account.balance, userId, account.id);
    },
};