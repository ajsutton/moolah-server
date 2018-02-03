const idGenerator = require('../../src/utils/idGenerator');

const minimalTransaction = {
    id: 'transaction1',
    type: 'expense',
    date: '2017-06-04',
    accountId: 'account-id',
    amount: 5000,
};

module.exports = {
    minimalTransaction,

    makeTransaction(args, template = minimalTransaction) {
        return Object.assign({}, template, {id: idGenerator()}, args);
    },
};