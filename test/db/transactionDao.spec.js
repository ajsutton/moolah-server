const db = require('../../src/db/database');
const transactionDao = require('../../src/db/transactionDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Transaction DAO', function() {
    let userId;
    const account1 = {id: 'account1', name: 'Account1', type: 'bank', balance: 0};

    beforeEach(async function() {
        userId = idGenerator();
    });

    it('should round trip a transaction', async function() {
        const transaction = {
            id: 'transaction1',
            type: 'expense',
            date: new Date(Date.UTC(2017, 6, 4)),
            accountId: account1.id,
            payee: 'Con the Fruiterer',
            amount: 5000,
            notes: 'Bought some apple. No worries!',
        };
        await transactionDao.create(userId, transaction);
        const result = await transactionDao.get(userId, transaction.id);
        assert.deepEqual(result, transaction);
    });
});