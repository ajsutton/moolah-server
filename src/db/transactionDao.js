const db = require('./database');

function asTransaction(object) {
    if (object === undefined) {
        return object;
    }
    const transaction = {};
    Object.entries(object).forEach(([key, value]) => {
        if (value !== null) {
            transaction[key] = value;
        }
    });
    return transaction;
}

module.exports = {
    create(userId, transaction) {
        return db.query('INSERT INTO transaction (user_id, id, type, date, account_id, payee, amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            userId, transaction.id, transaction.type, transaction.date, transaction.accountId, transaction.payee, transaction.amount, transaction.notes);
    },

    async get(userId, transactionId) {
        const results = await db.query(
            'SELECT id, type, date, account_id as accountId, payee, amount, notes ' +
            '  FROM transaction ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, transactionId);
        return asTransaction(results[0]);
    },

    async balance(userId, accountId) {
        const results = await db.query(
            'SELECT SUM(amount) as balance FROM transaction WHERE user_id = ? AND account_id = ?',
            userId, accountId
        );
        return results[0].balance || 0;
    }
};