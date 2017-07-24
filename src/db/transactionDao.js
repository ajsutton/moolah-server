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
    if (transaction.transferIn) {
        const actualAccountId = transaction.accountId;
        transaction.accountId = transaction.toAccountId;
        transaction.toAccountId = actualAccountId;
        transaction.amount *= -1;
    }
    delete transaction.transferIn;
    return transaction;
}

module.exports = class TransactionDao {
    constructor(query) {
        this.query = query;
    }

    create(userId, transaction) {
        return this.query(
            'INSERT INTO transaction (user_id, id, type, date, account_id, payee, amount, notes, category_id, to_account_id, recur_every, recur_period) ' +
            '     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            userId, transaction.id, transaction.type, transaction.date, transaction.accountId, transaction.payee, transaction.amount, transaction.notes, transaction.categoryId,
            transaction.toAccountId, transaction.recurEvery, transaction.recurPeriod);
    }

    store(userId, transaction) {
        const toStore = {
            type: transaction.type,
            date: transaction.date,
            account_id: transaction.accountId,
            to_account_id: transaction.toAccountId,
            payee: transaction.payee,
            amount: transaction.amount,
            notes: transaction.notes,
            category_id: transaction.categoryId,
            recur_every: transaction.recurEvery,
            recur_period: transaction.recurPeriod,
        };
        return this.query('UPDATE transaction SET ? WHERE user_id = ? AND id = ?',
            toStore, userId, transaction.id);
    }

    delete(userId, transactionId) {
        return this.query('DELETE FROM transaction WHERE user_id = ? AND id = ?', userId, transactionId);
    }

    async transaction(userId, transactionId) {
        const results = await this.query(
            'SELECT id, type, date, account_id AS accountId, payee, amount, notes, category_id AS categoryId, to_account_id AS toAccountId, recur_every as recurEvery, recur_period as recurPeriod ' +
            '  FROM transaction ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, transactionId);
        return asTransaction(results[0]);
    }

    async transactions(userId, options = {}) {
        const opts = Object.assign({ pageSize: 1000, offset: 0, accountId: undefined, scheduled: false}, options);
        const args = [opts.accountId, userId];
        let query = ` SELECT id, type, date, account_id as accountId, payee, amount, notes, category_id as categoryId, to_account_id as toAccountId, to_account_id = ? as transferIn, recur_every as recurEvery, recur_period as recurPeriod
            FROM transaction 
           WHERE user_id = ? `;

        if (opts.accountId !== undefined) {
            query += ` AND (account_id = ? OR to_account_id = ?) `;
            args.push(opts.accountId, opts.accountId);
        }
        if (opts.scheduled) {
            query += ' AND recur_every IS NOT NULL ';
        } else {
            query += ' AND recur_every IS NULL '
        }
        query += ` ORDER BY date DESC, id `;
        if (opts.pageSize !== undefined) {
            query += 'LIMIT ? OFFSET ?';
            args.push(opts.pageSize, opts.offset);
        }
        const results = await this.query(
            query,
            ...args);
        return results.map(asTransaction);
    }

    async balance(userId, accountId, priorToTransaction) {
        const args = [accountId, userId, accountId, accountId];
        let query = 'SELECT SUM(IF(account_id = ?, amount, -amount)) as balance FROM transaction WHERE user_id = ? AND (account_id = ? OR to_account_id = ?) ';
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