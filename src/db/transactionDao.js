const db = require('./database');

module.exports = {
    create(userId, transaction) {
        db.query('INSERT INTO transaction (user_id, id, type, date, account_id, payee, amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            userId, transaction.id, transaction.type, transaction.date, transaction.accountId, transaction.payee, transaction.amount, transaction.notes);
    },

    async get(userId, transactionId) {
        const results = await db.query(
            'SELECT id, type, date, account_id as accountId, payee, amount, notes ' +
            '  FROM transaction ' +
            ' WHERE user_id = ?' +
            '   AND id = ?',
            userId, transactionId);
        return results[0];
    },
};