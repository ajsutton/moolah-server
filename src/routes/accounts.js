module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        config: require('../handlers/getAccounts'),
    },
    {
        method: 'PUT',
        path: '/accounts/{id}/',
        config: require('../handlers/putAccount'),
    },
];