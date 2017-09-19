module.exports = class TransactionDao {
    constructor(query) {
        this.query = query;
    }

    incomeAndExpense(userId, currentDayOfMonth, afterDate) {
        const args = [userId];
        let query = ` SELECT MIN(date) as start,
                             MAX(date) as end,
                             SUM(IF(type = 'income', amount, 0)) AS income, 
                             SUM(IF(type = 'expense', amount, 0)) AS expense, 
                             SUM(amount) AS profit 
                        FROM transaction 
                       WHERE recur_period IS NULL 
                         AND user_id = ?
                         AND type IN ('income', 'expense') `;
        if (afterDate) {
            query += 'AND date > ? ';
            args.push(afterDate);
        }
        query += `GROUP BY IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date));`;
        args.push(currentDayOfMonth);
        return this.query(query, ...args);
    }

    dailyProfitAndLoss(userId, afterDate) {
        const args = [userId];
        let query = ` SELECT date, SUM(amount) AS profit 
                        FROM transaction 
                       WHERE recur_period IS NULL 
                         AND user_id = ?
                         AND type != 'transfer' `;
        if (afterDate) {
            query += ' AND DATE > ? ';
            args.push(afterDate);
        }
        query += `GROUP BY date `;
        return this.query(query, ...args);
    }

    expenseBreakdown(userId, afterDate) {
        let query = ` SELECT category_id as categoryId, SUM(amount) as totalExpenses 
                        FROM transaction 
                       WHERE recur_period IS NULL 
                         AND user_id = ?
                         AND type = 'expense' 
                         AND category_id IS NOT NULL
                         AND date > ?
                    GROUP BY category_id`
        return this.query(query, userId, afterDate);
    }
};