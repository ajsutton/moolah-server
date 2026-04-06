export default [
  {
    method: 'GET',
    path: '/api/auth/',
    config: import('../handlers/auth/loginState.js'),
  },
  {
    method: 'DELETE',
    path: '/api/auth/',
    config: import('../handlers/auth/logout.js'),
  },
  {
    method: 'POST',
    path: '/api/auth/token',
    config: import('../handlers/auth/tokenExchange.js'),
  },
  {
    method: '*',
    path: '/api/googleauth',
    config: import('../handlers/auth/googleLogin.js'),
  },
];
