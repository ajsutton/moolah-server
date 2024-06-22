export default [
    {
        method: 'GET',
        path: '/api/accounts/',
        config: import('../handlers/account/getAccounts.js'),
    },
    {
        method: 'POST',
        path: '/api/accounts/',
        config: import('../handlers/account/createAccount.js'),
    },
    {
        method: 'PUT',
        path: '/api/accounts/{id}/',
        config: import('../handlers/account/putAccount.js'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/',
        config: import('../handlers/account/getAccount.js'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/balances',
        config: import('../handlers/account/getAccountBalances.js'),
    },
    {
        method: 'PUT',
        path: '/api/accounts/{id}/values/{date}',
        config: import('../handlers/account/setValue.js'),
    },
    {
        method: 'DELETE',
        path: '/api/accounts/{id}/values/{date}',
        config: import('../handlers/account/removeValue.js'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/values/',
        config: import('../handlers/account/getValues.js'),
    },
];