module.exports = [
    {
        method: 'POST',
        path: '/api/transactions/',
        config: require('../handlers/transaction/createTransaction'),
    },
    {
        method: 'GET',
        path: '/api/transactions/',
        config: require('../handlers/transaction/getTransactions'),
    },
    {
        method: 'GET',
        path: '/api/transactions/{id}/',
        config: require('../handlers/transaction/getTransaction'),
    },
    {
        method: 'PUT',
        path: '/api/transactions/{id}/',
        config: require('../handlers/transaction/putTransaction'),
    },
    {
        method: 'DELETE',
        path: '/api/transactions/{id}/',
        config: require('../handlers/transaction/deleteTransaction'),
    },
];