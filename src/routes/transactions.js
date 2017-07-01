module.exports = [
    {
        method: 'POST',
        path: '/api/transactions/',
        config: require('../handlers/transaction/createTransaction'),
    },
    {
        method: 'GET',
        path: '/api/transactions/{id}/',
        config: require('../handlers/transaction/getTransaction'),
    },
];