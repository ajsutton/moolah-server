export default function transactionQuery(fields, userId, opts) {
    let query = `SELECT ${fields} 
                   FROM transaction t`;
    if (opts.hasCurrentAccount || opts.hasInvestmentAccount) {
        query += ' LEFT JOIN account af ON t.account_id = af.id'
        query += ' LEFT JOIN account at ON t.to_account_id = at.id'
    }
    query += ` WHERE t.user_id = ?`;
    const args = [userId];
    if (opts.accountId !== undefined) {
        query += ` AND (t.account_id = ? OR t.to_account_id = ?) `;
        args.push(opts.accountId, opts.accountId);
    }
    if (opts.scheduled) {
        query += ' AND t.recur_period IS NOT NULL ';
    } else {
        query += ' AND t.recur_period IS NULL ';
    }
    if (opts.from) {
        query += ' AND t.date >= ?';
        args.push(opts.from);
    }
    if (opts.to) {
        query += ' AND t.date <= ?';
        args.push(opts.to);
    }
    if (opts.categories && opts.categories.length > 0) {
        query += ' AND t.category_id IN (?) ';
        args.push(opts.categories);
    }
    if (opts.earmarkId) {
        query += ' AND t.earmark = ? ';
        args.push(opts.earmarkId);
    }
    if (opts.hasCurrentAccount) {
        query += ' AND t.account_id IS NOT NULL AND (t.type != "transfer" OR af.type != "investment" OR at.type != "investment") ';
    }
    if (opts.hasInvestmentAccount) {
        query += ' AND t.account_id IS NOT NULL AND (af.type = "investment" OR at.type = "investment") '
    }
    if (opts.hasEarmark) {
        query += ' AND t.earmark IS NOT NULL AND t.type != "transfer" ';
    }
    if (opts.transactionType) {
        query += ' AND t.type = ? ';
        args.push(opts.transactionType);
    }
    return {query, args};
};