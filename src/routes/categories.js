export default [
  {
    method: 'GET',
    path: '/api/categories/',
    config: import('../handlers/category/getCategories.js'),
  },
  {
    method: 'POST',
    path: '/api/categories/',
    config: import('../handlers/category/createCategory.js'),
  },
  {
    method: 'GET',
    path: '/api/categories/{id}/',
    config: import('../handlers/category/getCategory.js'),
  },
  {
    method: 'PUT',
    path: '/api/categories/{id}/',
    config: import('../handlers/category/putCategory.js'),
  },
  {
    method: 'DELETE',
    path: '/api/categories/{id}/',
    config: import('../handlers/category/deleteCategory.js'),
  },
];
