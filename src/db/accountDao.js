const db = require('./database');
const DEFAULT_POSITION = 0;
module.exports = {
    accounts(userId) {
        return db.query('SELECT id, name, type, position FROM account WHERE user_id = ? ORDER BY position, name', userId);
    },

    async account(userId, id) {
        const results = await db.query('SELECT id, name, type, position FROM account WHERE user_id = ? AND id = ?', userId, id);
        return results[0];
    },

    create(userId, account) {
        return db.query(
            'INSERT INTO account (user_id, id, name, type, position) VALUES (?, ?, ?, ?, ?)',
            userId, account.id, account.name, account.type, account.position || DEFAULT_POSITION,
        );
    },

    store(userId, account) {
        return db.query(
            'UPDATE account SET name = ?, type = ?, position = ? WHERE user_id = ? AND id = ?',
            account.name, account.type, account.position || DEFAULT_POSITION, userId, account.id);
    },
};