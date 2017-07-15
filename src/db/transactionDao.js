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

module.exports = class TransactionDao {
    constructor(query) {
        this.query = query;
    }

    create(userId, transaction) {
        return this.query('INSERT INTO transaction (user_id, id, type, date, account_id, payee, amount, notes, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            userId, transaction.id, transaction.type, transaction.date, transaction.accountId, transaction.payee, transaction.amount, transaction.notes, transaction.categoryId);
    }

    store(userId, transaction) {
        const toStore = {
            type: transaction.type,
            date: transaction.date,
            account_id: transaction.accountId,
            payee: transaction.payee,
            amount: transaction.amount,
            notes: transaction.notes,
            category_id: transaction.categoryId,
        };
        return this.query('UPDATE transaction SET ? WHERE user_id = ? and id = ?',
            toStore, userId, transaction.id);
    }

    async transaction(userId, transactionId) {
        const results = await this.query(
            'SELECT id, type, date, account_id as accountId, payee, amount, notes, category_id as categoryId ' +
            '  FROM transaction ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, transactionId);
        return asTransaction(results[0]);
    }

    async transactions(userId, accountId, pageSize, offset = 0) {
        const args = [userId, accountId];
        let query = ` SELECT id, type, date, account_id as accountId, payee, amount, notes 
            FROM transaction 
           WHERE user_id = ? 
             AND account_id = ? 
        ORDER BY date DESC, id `;
        if (pageSize !== undefined) {
            query += 'LIMIT ? OFFSET ?';
            args.push(pageSize, offset);
        }
        const results = await this.query(
            query,
            ...args);
        return results.map(asTransaction);
    }

    async balance(userId, accountId, priorToTransaction) {
        const args = [userId, accountId];
        let query = 'SELECT SUM(amount) as balance FROM transaction WHERE user_id = ? AND account_id = ? ';
        if (priorToTransaction !== undefined) {
            query += 'AND (date < ? OR (date = ? AND id < ?))';
            args.push(priorToTransaction.date, priorToTransaction.date, priorToTransaction.id);
        }
        const results = await this.query(
            query,
            ...args);
        return results[0].balance || 0;
    }

    async removeCategory(userId, categoryId) {
        return this.query('UPDATE transaction SET category_id = NULL WHERE user_id = ? and category_id = ?', userId, categoryId);
    }
};