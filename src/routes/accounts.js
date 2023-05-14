module.exports = [
    {
        method: 'GET',
        path: '/api/accounts/',
        config: require('../handlers/account/getAccounts'),
    },
    {
        method: 'POST',
        path: '/api/accounts/',
        config: require('../handlers/account/createAccount'),
    },
    {
        method: 'PUT',
        path: '/api/accounts/{id}/',
        config: require('../handlers/account/putAccount'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/',
        config: require('../handlers/account/getAccount'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/balances',
        config: require('../handlers/account/getAccountBalances'),
    },
    {
        method: 'PUT',
        path: '/api/accounts/{id}/values/{date}',
        config: require('../handlers/account/setValue'),
    },
    {
        method: 'DELETE',
        path: '/api/accounts/{id}/values/{date}',
        config: require('../handlers/account/removeValue'),
    },
    {
        method: 'GET',
        path: '/api/accounts/{id}/values/',
        config: require('../handlers/account/getValues'),
    },
];