module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        config: require('../handlers/getAccounts'),
    },
    {
        method: 'POST',
        path: '/accounts/',
        config: require('../handlers/createAccount'),
    },
    {
        method: 'PUT',
        path: '/accounts/{id}/',
        config: require('../handlers/putAccount'),
    },
];