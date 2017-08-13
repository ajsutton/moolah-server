const dbTestUtils = require('../utils/dbTestUtils');
const AnalysisDao = require('../../src/db/analysisDao');
const TransactionDao = require('../../src/db/transactionDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Analysis DAO', function() {
    let connection;
    let analysisDao;
    let transactionDao;
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
        connection = await dbTestUtils.createConnection();
        analysisDao = new AnalysisDao(dbTestUtils.queryFunction(connection));
        transactionDao = new TransactionDao(dbTestUtils.queryFunction(connection));
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId, connection);
        connection.destroy();
    });

    describe('Income and Expense', function() {
        beforeEach(async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'income', amount: 1000}));
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'expense', amount: -5000}));

            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'income', amount: -10}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'income', amount: 100}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'expense', amount: -50}));

            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'openingBalance', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'expense', amount: -250}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-15', type: 'expense', amount: -600}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', amount: -700}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', amount: 300}));
        });

        it('should get income and expense grouped by month', async function() {
            assert.deepEqual(await analysisDao.incomeAndExpense(userId, 31, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-05-31', income: 1000, expense: -5000, profit: -4000},
                {start: '2017-06-03', end: '2017-06-30', income: 90, expense: -50, profit: 40},
                {start: '2017-07-01', end: '2017-07-31', income: 800, expense: -1550, profit: -750},
            ]);
        });

        it('should get income and expense grouped by month using arbitrary month start offset', async function() {
            assert.deepEqual(await analysisDao.incomeAndExpense(userId, 15, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-06-03', income: 990, expense: -5000, profit: -4010},
                {start: '2017-06-30', end: '2017-07-15', income: 600, expense: -900, profit: -300},
                {start: '2017-07-31', end: '2017-07-31', income: 300, expense: -700, profit: -400},
            ]);
        });
    });

    describe('Daily Profit and Loss', function() {
        beforeEach(async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'income', amount: 1000}));
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'expense', amount: -5000}));

            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'income', amount: -10}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'income', amount: 100}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'expense', amount: -50}));

            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'openingBalance', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'expense', amount: -250}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', amount: -700}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', amount: 300}));
        });

        it('should get daily profit and loss', async function() {
            assert.deepEqual(await analysisDao.dailyProfitAndLoss(userId, '2017-06-01'), [
                {date: '2017-06-03', profit: -10 + 100 + -50},
                {date: '2017-07-01', profit: 500 + 500 + -250},
                {date: '2017-07-31', profit: -700 + 300},
            ]);
        });
    });

    function makeTransaction(args, template = minimalTransaction) {
        return Object.assign({}, template, {id: idGenerator()}, args);
    }
});