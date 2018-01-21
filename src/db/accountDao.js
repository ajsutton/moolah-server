const DEFAULT_POSITION = 0;

function asAccount(object) {
    if (object === undefined) {
        return object;
    }
    const account = {};
    Object.entries(object).forEach(([key, value]) => {
        if (value !== null) {
            account[key] = value;
        }
    });
    return account;
}


module.exports = class AccountsDao {
    constructor(query) {
        this.query = query;
    }

    async accounts(userId) {
        const accounts = await this.query(
            '  SELECT id, name, type, position, saving_target as savingsTarget, saving_start_date as savingsStartDate, saving_end_date as savingsEndDate ' +
            '    FROM account ' +
            '   WHERE user_id = ? ' +
            'ORDER BY position, name',
            userId);
        return accounts.map(asAccount);
    }

    async account(userId, id) {
        const results = await this.query(
            'SELECT id, name, type, position, saving_target as savingsTarget, saving_start_date as savingsStartDate, saving_end_date as savingsEndDate ' +
            '  FROM account ' +
            ' WHERE user_id = ? ' +
            '   AND id = ?',
            userId, id);
        return asAccount(results[0]);
    }

    create(userId, account) {
        return this.query(
            'INSERT INTO account (user_id, id, name, type, position, saving_target, saving_start_date, saving_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            userId, account.id, account.name, account.type, account.position || DEFAULT_POSITION, account.savingsTarget, account.savingsStartDate, account.savingsEndDate);
    }

    store(userId, account) {
        return this.query(
            'UPDATE account SET name = ?, type = ?, position = ? WHERE user_id = ? AND id = ?',
            account.name, account.type, account.position || DEFAULT_POSITION, userId, account.id);
    }
};