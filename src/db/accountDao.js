const stripNulls = require('./stripNulls');

const DEFAULT_POSITION = 0;

module.exports = class AccountsDao {
    constructor(query) {
        this.query = query;
    }

    async accounts(userId) {
        const accounts = await this.query(
            '  SELECT id, name, type, position ' +
            '    FROM account ' +
            '   WHERE user_id = ? ' +
            'ORDER BY position, name',
            userId);
        return accounts.map(stripNulls);
    }

    async account(userId, id) {
        const results = await this.query(
            'SELECT id, name, type, position ' +
            '  FROM account ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, id);
        return stripNulls(results[0]);
    }

    create(userId, account) {
        return this.query(
            'INSERT INTO account (user_id, id, name, type, position) VALUES (?, ?, ?, ?, ?)',
            userId, account.id, account.name, account.type, account.position || DEFAULT_POSITION);
    }

    store(userId, account) {
        return this.query(
            'UPDATE account SET name = ?, type = ?, position = ? WHERE user_id = ? AND id = ?',
            account.name, account.type, account.position || DEFAULT_POSITION, userId, account.id);
    }
};