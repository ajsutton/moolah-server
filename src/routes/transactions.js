export default [
    {
        method: 'POST',
        path: '/api/transactions/',
        config: import('../handlers/transaction/createTransaction.js'),
    },
    {
        method: 'GET',
        path: '/api/transactions/',
        config: import('../handlers/transaction/getTransactions.js'),
    },
    {
        method: 'GET',
        path: '/api/transactions/{id}/',
        config: import('../handlers/transaction/getTransaction.js'),
    },
    {
        method: 'PUT',
        path: '/api/transactions/{id}/',
        config: import('../handlers/transaction/putTransaction.js'),
    },
    {
        method: 'DELETE',
        path: '/api/transactions/{id}/',
        config: import('../handlers/transaction/deleteTransaction.js'),
    },
];