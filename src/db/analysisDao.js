module.exports = class TransactionDao {
    constructor(query) {
        this.query = query;
    }

    incomeAndExpense(userId, currentDayOfMonth, afterDate) {
        const args = [currentDayOfMonth, userId];
        let query = ` SELECT MIN(t.date) as start,
                             MAX(t.date) as end,
                             IF(DAYOFMONTH(t.date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(t.date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM t.date)) as month,
                             SUM(IF(t.type = 'income' AND t.account_id IS NOT NULL, amount, 0)) AS income, 
                             SUM(IF(t.type = 'expense' AND t.account_id IS NOT NULL, amount, 0)) AS expense, 
                             SUM(IF(t.account_id IS NOT NULL, t.amount, 0)) AS profit, 
                             SUM(IF(t.type = 'income' AND t.earmark IS NOT NULL, amount, 0)) AS earmarkedIncome, 
                             SUM(IF(t.type = 'expense' AND t.earmark IS NOT NULL, amount, 0)) AS earmarkedExpense, 
                             SUM(IF(t.earmark IS NOT NULL, t.amount, 0)) AS earmarkedProfit 
                        FROM transaction t
                       WHERE t.recur_period IS NULL 
                         AND t.user_id = ?
                         AND t.type IN ('income', 'expense')`;
        if (afterDate) {
            query += 'AND date > ? ';
            args.push(afterDate);
        }
        query += `GROUP BY IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date))
                  ORDER BY start;`;
        args.push(currentDayOfMonth);
        return this.query(query, ...args);
    }

    dailyProfitAndLoss(userId, afterDate) {
        const args = [userId];
        let query = ` SELECT date, SUM(IF(account_id IS NOT NULL, amount, 0)) AS profit, 
                                   SUM(IF(earmark IS NOT NULL OR a.type = 'investment', amount, 0)) AS earmarked 
                        FROM transaction t
                   LEFT JOIN account a ON t.account_id = a.id
                       WHERE recur_period IS NULL 
                         AND t.user_id = ?
                         AND t.type != 'transfer' `;
        if (afterDate) {
            query += ' AND DATE > ? ';
            args.push(afterDate);
        }
        query += `GROUP BY date `;
        return this.query(query, ...args);
    }

    expenseBreakdown(userId, currentDayOfMonth, afterDate) {
        const args = [currentDayOfMonth, userId];
        let query = ` SELECT category_id as categoryId, 
                             IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date)) as month,
                             SUM(amount) as totalExpenses 
                        FROM transaction 
                       WHERE recur_period IS NULL 
                         AND user_id = ?
                         AND type = 'expense' 
                         AND category_id IS NOT NULL `;
        if (afterDate) {
            query += ' AND date > ? ';
            args.push(afterDate);
        }
        query += `GROUP BY category_id, IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date))
                  ORDER BY category_id, month;`;
        args.push(currentDayOfMonth);
        return this.query(query, ...args);
    }
};