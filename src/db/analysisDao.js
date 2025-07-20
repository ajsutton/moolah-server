import mysql from 'mysql2/promise';

function selectTransactions(userId, quoteCurrency) {
  return `SELECT t.type, t.date, t.account_id, t.to_account_id, t.amount as nativeAmount, t.recur_period, t.earmark, af.type as fromAccountType, at.type as toAccountType, t.category_id,
                  ROUND(t.amount * IFNULL((SELECT e.rate
                           FROM exchange_rate e
                          WHERE t.user_id = e.user_id
                            AND af.currency = e.base
                            AND e.quote = ${mysql.escape(quoteCurrency)}
                            AND e.date <= t.date
                      ORDER BY e.date DESC
                          LIMIT 1), 1000000) / 1000000) as amount
            FROM transaction t
       LEFT JOIN account af ON af.id = t.account_id
       LEFT JOIN account at ON at.id = t.to_account_id
           WHERE t.user_id = ${mysql.escape(userId)}`;
}

export default class TransactionDao {
  constructor(query) {
    this.query = query;
  }

  incomeAndExpense(
    userId,
    currentDayOfMonth,
    afterDate,
    quoteCurrency = 'AUD'
  ) {
    const args = [currentDayOfMonth, userId];
    let query = ` SELECT MIN(t.date) as start,
                             MAX(t.date) as end,
                             IF(DAYOFMONTH(t.date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(t.date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM t.date)) as month,
                             SUM(IF(t.type = 'income' AND t.account_id IS NOT NULL, amount, 0)) AS income, 
                             SUM(IF(t.type = 'expense' AND t.account_id IS NOT NULL, amount, 0)) AS expense, 



                             SUM(IF(t.account_id IS NOT NULL AND t.type IN ('income', 'expense'), t.amount, 0)) AS profit, 

                            SUM(IF(t.type = 'income' AND t.earmark IS NOT NULL, amount, 0)) +
                                    SUM(IF(t.type = 'transfer' AND fromAccountType = 'investment' AND amount < 0, amount, 0)) +
                                    SUM(IF(t.type = 'transfer' AND toAccountType = 'investment' AND amount > 0, -amount, 0)) AS earmarkedIncome, 

                             SUM(IF(t.type = 'expense' AND t.earmark IS NOT NULL, amount, 0)) +
                                SUM(IF(t.type = 'transfer' AND toAccountType = 'investment' AND amount < 0, -amount, 0)) +
                                SUM(IF(t.type = 'transfer' AND fromAccountType = 'investment' AND amount > 0, amount, 0)) AS earmarkedExpense, 

                             SUM(IF(t.earmark IS NOT NULL AND t.type IN ('income', 'expense'), t.amount, 0)) +
                                    SUM(IF(t.type = 'transfer' AND fromAccountType = 'investment', amount, 0)) +
                                    SUM(IF(t.type = 'transfer' AND toAccountType = 'investment', -amount, 0)) AS earmarkedProfit 
                        FROM (${selectTransactions(userId, quoteCurrency)}
                                AND t.recur_period IS NULL
                                AND (t.type IN ('income', 'expense') OR (t.type = 'transfer' AND at.type = 'investment' OR af.type = 'investment'))
                                AND t.user_id = ? `;
    if (afterDate) {
      query += 'AND date > ? ';
      args.push(afterDate);
    }
    query += ') AS t ';
    query += `GROUP BY IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date))
                  ORDER BY start;`;
    args.push(currentDayOfMonth);
    return this.query(query, ...args);
  }

  dailyProfitAndLoss(userId, afterDate, quoteCurrency = 'AUD') {
    const args = [userId];
    let query = ` SELECT date,
                            SUM(IF(account_id IS NOT NULL AND fromAccountType = "investment" AND toAccountType != "investment", amount, 0)) -
                                SUM(IF(account_id IS NOT NULL AND fromAccountType != "investment" AND toAccountType = "investment", amount, 0)) AS investments,


                            SUM(IF(account_id IS NOT NULL AND fromAccountType != "investment", amount, 0)) -
                                SUM(IF(t.type = "transfer" AND account_id IS NOT NULL AND toAccountType != "investment", amount, 0)) AS profit,

                            SUM(IF(earmark IS NOT NULL, amount, 0)) AS earmarked 
                        FROM (${selectTransactions(userId, quoteCurrency)}
                         AND recur_period IS NULL 
                         AND t.user_id = ?
                         AND (t.type != 'transfer' OR at.type = 'investment' OR af.type = 'investment')`;
    if (afterDate) {
      query += ' AND DATE > ? ';
      args.push(afterDate);
    }
    query += ') AS t ';
    query += `GROUP BY date ORDER BY date`;
    return this.query(query, ...args);
  }

  expenseBreakdown(
    userId,
    currentDayOfMonth,
    afterDate,
    quoteCurrency = 'AUD'
  ) {
    const args = [currentDayOfMonth, userId];
    let query = ` SELECT category_id as categoryId, 
                             IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date)) as month,
                             SUM(amount) as totalExpenses 
                        FROM (${selectTransactions(userId, quoteCurrency)}
                         AND t.recur_period IS NULL 
                         AND t.user_id = ?
                         AND t.type = 'expense' 
                         AND t.category_id IS NOT NULL `;
    if (afterDate) {
      query += ' AND date > ? ';
      args.push(afterDate);
    }
    query += ') AS t ';
    query += `GROUP BY category_id, IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date))
                  ORDER BY category_id, month;`;
    args.push(currentDayOfMonth);
    return this.query(query, ...args);
  }
}
