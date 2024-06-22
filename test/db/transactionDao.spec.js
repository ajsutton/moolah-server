import dbTestUtils from '../utils/dbTestUtils.js';
import TransactionDao from '../../src/db/transactionDao.js';
import CategoryDao from '../../src/db/categoryDao.js';
import AccountsDao from '../../src/db/accountDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';
import {minimalTransaction, makeTransaction} from './transactionHelper.js';

describe('Transaction DAO', function() {
    let connection;
    let transactionDao;
    let accountsDao;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        connection = await dbTestUtils.createConnection();
        accountsDao = new AccountsDao(dbTestUtils.queryFunction(connection));
        transactionDao = new TransactionDao(dbTestUtils.queryFunction(connection));
        await accountsDao.create(userId, {id: 'account-id', name: 'Account 1', type: 'bank', position: 7});
        await accountsDao.create(userId, {id: 'account1', name: 'Account 1', type: 'bank', position: 7});
        await accountsDao.create(userId, {id: 'account2', name: 'Account 1', type: 'bank', position: 7});
        await accountsDao.create(userId, {id: 'otherAccount', name: 'Account 1', type: 'bank', position: 7});
        await accountsDao.create(userId, {id: 'earmark', name: 'Earmark', type: 'earmark', position: 7});
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId, connection);
        connection.destroy();
    });

    describe('Storing Transactions', function() {
        it('should round trip a transaction', async function() {
            const transaction = {
                id: 'transaction1',
                type: 'expense',
                date: '2017-06-04',
                accountId: 'account-id',
                payee: 'Con the Fruiterer',
                amount: 5000,
                notes: 'Bought some apple. No worries!',
                categoryId: 'category-id',
                toAccountId: 'account-2',
                earmark: 'earmark',
                recurEvery: 2,
                recurPeriod: 'MONTH'
            };
            await transactionDao.create(userId, transaction);
            const result = await transactionDao.transaction(userId, transaction.id);
            assert.deepEqual(result, transaction);
            assert.deepEqual(await transactionDao.transactions(userId, {accountId: 'account-id', scheduled: true}), [transaction]);
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
            const modifiedTransaction = makeTransaction({
                id: originalTransaction.id,
                date: '2011-02-03',
                accountId: 'foo',
                payee: 'Lucy',
                notes: 'New notes',
                amount: 12345,
                type: 'income',
                categoryId: '3',
                toAccountId: '7',
                recurEvery: 3,
                recurPeriod: 'YEAR',
            });
            await transactionDao.store(userId, modifiedTransaction);
            assert.deepEqual(await transactionDao.transaction(userId, originalTransaction.id), modifiedTransaction);
        });

        it('should delete transaction', async function() {
            await transactionDao.create(userId, minimalTransaction);
            await transactionDao.delete(userId, minimalTransaction.id);
            assert.isUndefined(await transactionDao.transaction(userId, minimalTransaction.id));
        });
    });

    describe('Searching Transations', function() {
        it('should get list of transactions in account ordered by date descending', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
            assert.deepEqual(transactions, [transaction3, transaction1, transaction2]);
        });

        it('should include transfer to the account in the list of transactions', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({accountId: 'otherAccount', type: 'transfer', toAccountId: minimalTransaction.accountId, amount: -2000, date: '2017-05-30'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
            assert.deepEqual(transactions, [
                transaction3,
                transaction1,
                makeTransaction({id: transaction2.id, accountId: minimalTransaction.accountId, type: 'transfer', toAccountId: 'otherAccount', amount: 2000, date: '2017-05-30'}),
            ]);
        });

        it('should exclude scheduled transactions', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
            assert.deepEqual(transactions, [
                transaction3,
                transaction1,
            ]);
        });

        it('should query all scheduled transactions in any account', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account1'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account2'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03', accountId: 'account1'});
            const transaction4 = makeTransaction({amount: -2000, date: '2017-06-02', toAccountId: 'account1', recurEvery: 1, recurPeriod: 'MONTH', accountId: 'account2'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);
            await transactionDao.create(userId, transaction4);

            const transactions = await transactionDao.transactions(userId, {scheduled: true});
            assert.deepEqual(transactions, [
                transaction4,
                transaction1,
                transaction2,
            ]);
        });

        it('should return empty list when no transactions in account', async function() {
            const transactions = await transactionDao.transactions(userId, {accountId: minimalTransaction.accountId});
            assert.deepEqual(transactions, []);
        });

        it('should list transactions after specified date', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            assert.deepEqual(await transactionDao.transactions(userId, {from: '2017-06-01'}), [ transaction3, transaction1 ]);
            assert.deepEqual(await transactionDao.transactions(userId, {from: '2017-06-02'}), [ transaction3 ]);
        });

        it('should list transactions before specified date', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            assert.deepEqual(await transactionDao.transactions(userId, {to: '2017-06-01'}), [ transaction1, transaction2 ]);
            assert.deepEqual(await transactionDao.transactions(userId, {to: '2017-05-30'}), [ transaction2 ]);
        });

        it('should list transactions between specified dates', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            assert.deepEqual(await transactionDao.transactions(userId, {from: '2017-06-01', to: '2017-06-02'}), [ transaction1 ]);
        });
    });

    it('should count transactions', async function() {
        const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
        const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH'});
        const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
        await transactionDao.create(userId, transaction1);
        await transactionDao.create(userId, transaction2);
        await transactionDao.create(userId, transaction3);

        const count = await transactionDao.transactionCount(userId, {accountId: minimalTransaction.accountId, scheduled: false});
        assert.equal(count, 2);
    });

    describe('Balance Calculations', function() {
        it('should calculate account balance', async function() {
            await transactionDao.create(userId, makeTransaction({amount: 5000}));
            await transactionDao.create(userId, makeTransaction({amount: -2000}));
            await transactionDao.create(userId, makeTransaction({amount: 300}));

            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId});
            assert.equal(balance, 3300);
        });

        it('should calculate account balance prior to transaction', async function() {
            const transaction1 = makeTransaction({amount: 5000, id: 1});
            const transaction2 = makeTransaction({amount: -2000, id: 2});
            const transaction3 = makeTransaction({amount: 300, id: 3});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId}, transaction2);
            assert.equal(balance, -1700);
        });

        it('should return 0 balance when there are no transactions', async function() {
            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId});
            assert.equal(balance, 0);
        });

        it('should add negative amount of transfers to account when calculating balance', async function() {
            await transactionDao.create(userId, makeTransaction({amount: 5000,}));
            await transactionDao.create(userId, makeTransaction({amount: -2000, accountId: 'otherAccount', toAccountId: minimalTransaction.accountId}));
            await transactionDao.create(userId, makeTransaction({amount: 300}));

            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId});
            assert.equal(balance, 7300);
        });

        it('should exclude scheduled transactions when calculating balance', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', recurEvery: 1, recurPeriod: 'MONTH'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId});
            assert.equal(balance, 5300);
        });

        it('should exclude transactions in earmark accounts when calculating balance', async function() {
            const transaction1 = makeTransaction({amount: 5000, date: '2017-06-01'});
            const transaction2 = makeTransaction({amount: -2000, date: '2017-05-30', accountId: 'earmark'});
            const transaction3 = makeTransaction({amount: 300, date: '2017-06-03'});
            await transactionDao.create(userId, transaction1);
            await transactionDao.create(userId, transaction2);
            await transactionDao.create(userId, transaction3);

            const balance = await transactionDao.balance(userId, {accountId: minimalTransaction.accountId});
            assert.equal(balance, 5300);
        });
    });

    describe('Balance by Category', function() {
        let categoryDao;
        beforeEach(async function() {
            categoryDao = new CategoryDao(dbTestUtils.queryFunction(connection));
            await categoryDao.create(userId, {id: 'test1', name: 'Test1'});
            await categoryDao.create(userId, {id: 'test2', name: 'Test2'});
            await categoryDao.create(userId, {id: 'test2a', name: 'Test2a', parentId: 'test2'});
        });

        it('should calculate total balance by category', async function() {
            await transactionDao.create(userId, makeTransaction({amount: 5000, categoryId: 'test1'}));
            await transactionDao.create(userId, makeTransaction({amount: -2000, categoryId: 'test1'}));
            await transactionDao.create(userId, makeTransaction({amount: 300, categoryId: 'test2'}));

            const balances = await transactionDao.balanceByCategory(userId, {});
            assert.deepEqual(balances, {
                test1: 3000,
                test2: 300
            });
        });

        it('should calculate total balance by category for an account', async function() {
            await transactionDao.create(userId, makeTransaction({amount: 5000, categoryId: 'test1', accountId: 'earmark'}));
            await transactionDao.create(userId, makeTransaction({amount: -2000, categoryId: 'test1', accountId: 'earmark'}));
            await transactionDao.create(userId, makeTransaction({amount: 300, categoryId: 'test2', accountId: 'account1'}));
            await transactionDao.create(userId, makeTransaction({amount: 400, categoryId: 'test3', accountId: 'earmark'}));

            const balances = await transactionDao.balanceByCategory(userId, {accountId: 'earmark'});
            assert.deepEqual(balances, {
                test1: 3000,
                test3: 400
            });
        });
    });
});