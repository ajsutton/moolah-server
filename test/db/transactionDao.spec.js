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
        date: new Date(Date.UTC(2017, 6, 4)),
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
            date: new Date(Date.UTC(2017, 6, 4)),
            accountId: 'account-id',
            payee: 'Con the Fruiterer',
            amount: 5000,
            notes: 'Bought some apple. No worries!',
        };
        await transactionDao.create(userId, transaction);
        const result = await transactionDao.get(userId, transaction.id);
        assert.deepEqual(result, transaction);
    });

    it('should create transaction with minimal required values', async function() {

        await transactionDao.create(userId, minimalTransaction);
        const result = await transactionDao.get(userId, minimalTransaction.id);
        assert.deepEqual(result, minimalTransaction);
    });

    it('should return undefined when transaction does not exist', async function() {
        const transaction = await transactionDao.get(userId, 'nope');
        assert.isUndefined(transaction);
    });

    it('should return undefined when transaction belongs to a different user', async function() {
        await transactionDao.create(userId, minimalTransaction);
        const transaction = await transactionDao.get('someone else', minimalTransaction.id);
        assert.isUndefined(transaction);
    });
});