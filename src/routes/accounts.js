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
];