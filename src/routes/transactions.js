module.exports = [
    {
        method: 'POST',
        path: '/api/transactions/',
        config: require('../handlers/transaction/createTransaction'),
    },
];