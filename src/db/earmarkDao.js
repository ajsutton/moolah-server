const stripNulls = require('./stripNulls');
const DEFAULT_POSITION = 0;
const transactionQuery = require('./transactionQuery');
const selectBalance = require('./selectBalance');

module.exports = class EarmarksDao {
    constructor(query) {
        this.query = query;
    }

    async earmarks(userId) {
        const earmarks = await this.query(
            '  SELECT id, name, position, saving_target as savingsTarget, saving_start_date as savingsStartDate, saving_end_date as savingsEndDate ' +
            '    FROM earmark ' +
            '   WHERE user_id = ? ' +
            'ORDER BY position, name',
            userId);
        return earmarks.map(stripNulls);
    }

    async earmark(userId, id) {
        const results = await this.query(
            'SELECT id, name, position, saving_target as savingsTarget, saving_start_date as savingsStartDate, saving_end_date as savingsEndDate ' +
            '  FROM earmark ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, id);
        return stripNulls(results[0]);
    }

    create(userId, earmark) {
        return this.query(
            'INSERT INTO earmark (user_id, id, name, position, saving_target, saving_start_date, saving_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            userId, earmark.id, earmark.name, earmark.position || DEFAULT_POSITION, earmark.savingsTarget, earmark.savingsStartDate, earmark.savingsEndDate);
    }

    store(userId, earmark) {
        return this.query(
            'UPDATE earmark SET name = ?, position = ?, saving_target = ?, saving_start_date = ?, saving_end_date = ? WHERE user_id = ? AND id = ?',
            earmark.name, earmark.position || DEFAULT_POSITION, earmark.savingsTarget, earmark.savingsStartDate, earmark.savingsEndDate, userId, earmark.id);
    }

    async balances(userId, earmarkId) {
        const {query, args} = transactionQuery('SUM(t.amount) as balance, SUM(IF(t.type = \'income\', t.amount, 0)) as saved, SUM(IF(t.type = \'expense\', t.amount, 0)) as spent', userId, {earmarkId});
        return (await this.query(query, ...args))[0];
    }
};