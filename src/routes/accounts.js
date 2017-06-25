module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        handler: {
            async: require('../handlers/getAccounts'),
        }
    },
];