module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        config: require('../handlers/account/getAccounts'),
    },
    {
        method: 'POST',
        path: '/accounts/',
        config: require('../handlers/account/createAccount'),
    },
    {
        method: 'PUT',
        path: '/accounts/{id}/',
        config: require('../handlers/account/putAccount'),
    },
    {
        method: 'GET',
        path: '/accounts/{id}/',
        config: require('../handlers/account/getAccount'),
    },
];