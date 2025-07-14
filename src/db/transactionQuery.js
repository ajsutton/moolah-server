import mysql from 'mysql2';

export default function transactionQuery(fields, userId, opts) {
  const args = [];
  let query = `SELECT `;
  if (opts.quoteCurrency !== undefined) {
    const fromQuery = `
      IFNULL((SELECT e.rate
         FROM exchange_rate e
        WHERE t.user_id = e.user_id
          AND af.currency = e.base
          AND e.quote = ${mysql.escape(opts.quoteCurrency)}
          AND e.date <= t.date
    ORDER BY e.date DESC
        LIMIT 1), 1000000)`;
    const toQuery = `IFNULL((SELECT e.rate
         FROM exchange_rate e
        WHERE t.user_id = e.user_id
          AND at.currency = e.base
          AND e.quote = ${mysql.escape(opts.quoteCurrency)}
          AND e.date <= t.date
    ORDER BY e.date DESC
        LIMIT 1), 1000000)`;
    query += fields
      .replaceAll('%fromRate%', fromQuery)
      .replaceAll('%toRate%', toQuery);
  } else {
    query += fields;
  }
  query += ' FROM transaction t';
  if (
    opts.hasCurrentAccount ||
    opts.hasInvestmentAccount ||
    opts.quoteCurrency !== undefined
  ) {
    query += ' LEFT JOIN account af ON t.account_id = af.id';
    query += ' LEFT JOIN account at ON t.to_account_id = at.id';
  }
  query += ` WHERE t.user_id = ?`;
  args.push(userId);
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
    query +=
      ' AND t.account_id IS NOT NULL AND (t.type != "transfer" OR af.type != "investment" OR at.type != "investment") ';
  }
  if (opts.hasInvestmentAccount) {
    query +=
      ' AND t.account_id IS NOT NULL AND (af.type = "investment" OR at.type = "investment") ';
  }
  if (opts.hasEarmark) {
    query += ' AND t.earmark IS NOT NULL AND t.type != "transfer" ';
  }
  if (opts.transactionType) {
    query += ' AND t.type = ? ';
    args.push(opts.transactionType);
  }
  if (opts.payee) {
    query += ' AND t.payee LIKE ?';
    args.push(`%${opts.payee}%`);
  }
  return { query, args };
}
