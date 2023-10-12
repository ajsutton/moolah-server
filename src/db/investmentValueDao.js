

module.exports = class InvestmentValueDao {
    constructor(query) {
        this.query = query;
    }

    async setValue(userId, accountId, date, value) {
        return this.query(
            'INSERT INTO investment_value (user_id, account_id, date, value) VALUES (?, ?, ?, ?)' + 
            ' ON DUPLICATE KEY UPDATE value = VALUES(value)',
            userId, accountId, date, value);
    }

    async getLatestValue(userId, accountId) {
        const results = await this.query('SELECT IFNULL(value, 0) as value FROM investment_value WHERE user_id = ? AND account_id = ? ORDER BY date DESC LIMIT 1',
            userId, accountId);
        return results.length > 0 ? results[0].value : undefined;
    }

    async getValues(userId, options = {}) {
        const opts = Object.assign({pageSize: 1000, offset: 0, accountId: undefined, from: undefined, to: undefined}, options);
        const args = [userId, opts.accountId];
        let query = 'SELECT date, value FROM investment_value WHERE user_id = ? AND account_id = ?';
        if (opts.from) {
            query += ' AND date >= ?';
            args.push(opts.from);
        }
        if (opts.to) {
            query += ' AND date <= ?';
            args.push(opts.to);
        }
        query += ` ORDER BY date DESC `;
        if (opts.pageSize !== undefined) {
            query += 'LIMIT ? OFFSET ?';
            args.push(opts.pageSize, opts.offset);
        }
        return await this.query(query, ...args);
    }

    async getCombinedValues(userId, options = {}) {
        const opts = Object.assign({from: 0, to: undefined}, options);
        const args = [opts.from, userId, opts.from];
        let query = `SELECT 
                v.date, 
                SUM(v.value - IFNULL((SELECT v2.value
                                FROM investment_value v2 
                                WHERE v2.date < v.date 
                                AND v2.user_id = v.user_id 
                                AND v2.account_id = v.account_id 
                                AND v2.date >= ?
                            ORDER BY v2.date DESC
                                LIMIT 1), 0)) as delta
            FROM investment_value v 
           WHERE v.user_id = ?
             AND v.date >= ?`;
        if (opts.to) {
            query += ' AND v.date <= ?'
            args.push(opts.to);
        }
        query += ' GROUP BY v.date'
        return await this.query(query, ...args)
    }

    async removeValue(userId, accountId, date) {
        await this.query('DELETE FROM investment_value WHERE user_id = ? AND account_id = ? AND date = ?', userId, accountId, date);
    }
}