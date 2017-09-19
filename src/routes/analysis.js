module.exports = [
    {
        method: 'GET',
        path: '/api/analysis/incomeAndExpense/',
        config: require('../handlers/analysis/incomeAndExpense'),
    },
    {
        method: 'GET',
        path: '/api/analysis/dailyBalances/',
        config: require('../handlers/analysis/dailyBalances'),
    },
    {
        method: 'GET',
        path: '/api/analysis/expenseBreakdown/',
        config: require('../handlers/analysis/expenseBreakdown'),
    },
];