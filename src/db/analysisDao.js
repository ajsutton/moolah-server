
module.exports = class TransactionDao {
    constructor(query) {
        this.query = query;
    }

    async incomeAndExpense(userId, currentDayOfMonth, afterDate) {
        const query = `
  SELECT MIN(date) as start,
         MAX(date) as end,
         SUM(IF(type = 'income', amount, 0)) AS income, 
         SUM(IF(type = 'expense', amount, 0)) AS expense, 
         SUM(IF(type = 'income' OR type = 'expense', amount, 0)) AS profit 
    FROM transaction 
   WHERE recur_period IS NULL 
     AND user_id = ?
     AND date > ?
     AND type IN ('income', 'expense') 
GROUP BY IF(DAYOFMONTH(date) > ?, EXTRACT(YEAR_MONTH FROM DATE_ADD(date, INTERVAL 1 MONTH)), EXTRACT(YEAR_MONTH FROM date));`
        return this.query(query, userId, afterDate, currentDayOfMonth);
    }
};