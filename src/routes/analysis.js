export default [
  {
    method: 'GET',
    path: '/api/analysis/incomeAndExpense/',
    config: import('../handlers/analysis/incomeAndExpense.js'),
  },
  {
    method: 'GET',
    path: '/api/analysis/dailyBalances/',
    config: import('../handlers/analysis/dailyBalances.js'),
  },
  {
    method: 'GET',
    path: '/api/analysis/expenseBreakdown/',
    config: import('../handlers/analysis/expenseBreakdown.js'),
  },
  {
    method: 'GET',
    path: '/api/analysis/categoryBalances/',
    config: import('../handlers/analysis/categoryBalances.js'),
  },
];
