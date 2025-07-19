export default [
  {
    method: 'GET',
    path: '/api/rates/',
    config: import('../handlers/rates/getRates.js'),
  },
  {
    method: 'POST',
    path: '/api/rates/',
    config: import('../handlers/rates/setRates.js'),
  },
];
