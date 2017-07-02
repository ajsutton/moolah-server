const db = require('../../src/db/database');
const dbTestUtils = require('../utils/dbTestUtils');
const transactionDao = require('../../src/db/transactionDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Transaction DAO', function() {
    let userId;
    const minimalTransaction = {
        id: 'transaction1',
        type: 'expense',
        date: '2017-06-04',
        accountId: 'account-id',
        amount: 5000,
    };

    beforeEach(async function() {
        userId = idGenerator();
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId);
    });

    it('should round trip a transaction', async function() {
        const transaction = {
            id: 'transaction1',
            type: 'expense',
            date: '2017-06-04',
            accountId: 'account-id',
            payee: 'Con the Fruiterer',
            amount: 5000,
            notes: 'Bought some apple. No worries!',
        };
        await transactionDao.create(userId, transaction);
        const result = await transactionDao.transaction(userId, transaction.id);
        assert.deepEqual(result, transaction);
    });

    it('should create transaction with minimal required values', async function() {

        await transactionDao.create(userId, minimalTransaction);
        const result = await transactionDao.transaction(userId, minimalTransaction.id);
        assert.deepEqual(result, minimalTransaction);
    });

    it('should return undefined when transaction does not exist', async function() {
        const transaction = await transactionDao.transaction(userId, 'nope');
        assert.isUndefined(transaction);
    });

    it('should return undefined when transaction belongs to a different user', async function() {
        await transactionDao.create(userId, minimalTransaction);
        const transaction = await transactionDao.transaction('someone else', minimalTransaction.id);
        assert.isUndefined(transaction);
    });

    it('should update transaction', async function() {
        const originalTransaction = makeTransaction({payee: 'Jenny', notes: 'Some notes'});
        await transactionDao.create(userId, originalTransaction);
        const modifiedTransaction = makeTransaction({id: originalTransaction.id, date: '2011-02-03', accountId: 'foo', payee: 'Lucy', notes: 'New notes', amount: 12345, type: 'income'});
        await transactionDao.store(userId, modifiedTransaction);
        assert.deepEqual(await transactionDao.transaction(userId, originalTransaction.id), modifiedTransaction);
    });

    it('should calculate account balance', async function() {
        await transactionDao.create(userId, makeTransaction({amount: 5000}));
        await transactionDao.create(userId, makeTransaction({amount: -2000}));
        await transactionDao.create(userId, makeTransaction({amount: 300}));

        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 3300);
    });

    it('should return 0 balance when there are no transactions', async function() {
        const balance = await transactionDao.balance(userId, minimalTransaction.accountId);
        assert.equal(balance, 0);
    });

    function makeTransaction(args, template = minimalTransaction) {
        return Object.assign({}, template, {id: idGenerator()}, args);
    }
});