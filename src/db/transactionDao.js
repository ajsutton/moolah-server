const stripNulls = require('./stripNulls');
const transactionQuery = require('./transactionQuery');
const selectBalance = require('./selectBalance');

function asTransaction(object) {
    if (object === undefined) {
        return object;
    }
    const transaction = stripNulls(object);
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
            'INSERT INTO transaction (user_id, id, type, date, account_id, payee, amount, notes, category_id, to_account_id, earmark, recur_every, recur_period) ' +
            '     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            userId, transaction.id, transaction.type, transaction.date, transaction.accountId, transaction.payee, transaction.amount, transaction.notes, transaction.categoryId,
            transaction.toAccountId, transaction.earmark, transaction.recurEvery, transaction.recurPeriod);
    }

    store(userId, transaction) {
        const toStore = {
            type: transaction.type,
            date: transaction.date,
            account_id: transaction.accountId,
            to_account_id: transaction.toAccountId,
            earmark: transaction.earmark,
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
            'SELECT id, type, date, account_id AS accountId, payee, amount, notes, category_id AS categoryId, to_account_id AS toAccountId, earmark, recur_every as recurEvery, recur_period as recurPeriod ' +
            '  FROM transaction ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, transactionId);
        return asTransaction(results[0]);
    }

    async transactions(userId, options = {}) {
        const opts = Object.assign({pageSize: 1000, offset: 0, accountId: undefined, scheduled: false, from: undefined, to: undefined}, options);
        const args = [opts.accountId];
        const builder = transactionQuery('t.id, t.type, t.date, t.account_id as accountId, t.payee, t.amount, t.notes, t.category_id as categoryId, t.to_account_id as toAccountId, earmark, t.to_account_id = ? as transferIn, t.recur_every as recurEvery, t.recur_period as recurPeriod', userId, opts);
        let query = builder.query;
        args.push(...builder.args);
        query += ` ORDER BY date DESC, id `;
        if (opts.pageSize !== undefined) {
            query += 'LIMIT ? OFFSET ?';
            args.push(opts.pageSize, opts.offset);
        }
        const results = await this.query(query, ...args);
        return results.map(asTransaction);
    }

    async transactionCount(userId, options = {}) {
        const opts = Object.assign({accountId: undefined, scheduled: false, from: undefined, to: undefined}, options);
        const builder = transactionQuery('COUNT(*) as transactionCount', userId, opts);
        const results = await this.query(builder.query, ...builder.args);
        return results[0].transactionCount || 0;
    }

    async balance(userId, options, forTransaction) {
        const args = [];
        const builder = transactionQuery(selectBalance(options, args), userId, options);
        args.push(...builder.args);
        let query = builder.query;
        if (forTransaction !== undefined) {
            query += ' AND (t.date < ? OR (t.date = ? AND t.id >= ?)) ';
            args.push(forTransaction.date, forTransaction.date, forTransaction.id);
        }

        const results = await this.query(query, ...args);
        return results[0].balance || 0;
    }

    async dailyBalanceChange(userId, options) {
        const args = [];
        const builder = transactionQuery(selectBalance(options, args) + ", t.date as date", userId, options);
        args.push(...builder.args);
        let query = builder.query;
        if (options.accountId === undefined) {
            query += 'AND t.type != "transfer" ';
        }
        query += 'GROUP BY t.date ';
        const results = await this.query(query, ...args);
        return results.map(row => {
            return {profit: row.balance, date: row.date};
        });
    }

    async balanceByCategory(userId, options, forTransaction) {
        const args = [];
        const builder = transactionQuery('category_id as categoryId, ' + selectBalance(options, args), userId, options);
        args.push(...builder.args);
        let query = builder.query + ' AND t.category_id IS NOT NULL ';

        if (forTransaction !== undefined) {
            query += 'AND (t.date < ? OR (t.date = ? AND t.id >= ?)) ';
            args.push(forTransaction.date, forTransaction.date, forTransaction.id);
        }
        if (options.accountId === undefined) {
            query += 'AND t.type != "transfer" ';
        }
        query += ' GROUP BY category_id';

        const results = await this.query(query, ...args);
        return results.reduce((result, {categoryId, balance}) => {
            result[categoryId] = balance;
            return result;
        }, {});
    }

    async removeCategory(userId, categoryId, replacementCategoryId = null) {
        return this.query('UPDATE transaction SET category_id = ? WHERE user_id = ? and category_id = ?', replacementCategoryId, userId, categoryId);
    }
};