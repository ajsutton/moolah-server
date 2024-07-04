export default [
  {
    method: 'GET',
    path: '/api/earmarks/',
    config: import('../handlers/earmark/getEarmarks.js'),
  },
  {
    method: 'POST',
    path: '/api/earmarks/',
    config: import('../handlers/earmark/createEarmark.js'),
  },
  {
    method: 'PUT',
    path: '/api/earmarks/{id}/',
    config: import('../handlers/earmark/putEarmark.js'),
  },
  {
    method: 'GET',
    path: '/api/earmarks/{id}/',
    config: import('../handlers/earmark/getEarmark.js'),
  },

  {
    method: 'PUT',
    path: '/api/earmarks/{earmarkId}/budget/{categoryId}/',
    config: import('../handlers/earmark/budget/setBudget.js'),
  },
  {
    method: 'GET',
    path: '/api/earmarks/{earmarkId}/budget/{categoryId}/',
    config: import('../handlers/earmark/budget/getBudget.js'),
  },
  {
    method: 'GET',
    path: '/api/earmarks/{earmarkId}/budget/',
    config: import('../handlers/earmark/budget/getBudgets.js'),
  },
];
