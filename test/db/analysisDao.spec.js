const dbTestUtils = require('../utils/dbTestUtils');
const AnalysisDao = require('../../src/db/analysisDao');
const CategoryDao = require('../../src/db/categoryDao');
const TransactionDao = require('../../src/db/transactionDao');
const AccountsDao = require('../../src/db/accountDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Analysis DAO', function() {
    let connection;
    let analysisDao;
    let transactionDao;
    let accountsDao;
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
        accountsDao = new AccountsDao(dbTestUtils.queryFunction(connection));

        await accountsDao.create(userId, {id: 'account-id', name: 'Account 1', type: 'bank', position: 7});
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
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'income', earmark: 'earmark1', amount: 100}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-30', type: 'expense', earmark: 'earmark1', amount: -50}));

            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'openingBalance', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'expense', amount: -250}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-15', type: 'expense', earmark: 'earmark2', amount: -600}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', amount: -700}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', amount: 300}));
        });

        it('should get income and expense grouped by month', async function() {
            assert.deepEqual(await analysisDao.incomeAndExpense(userId, 31, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-05-31', month: 201705, income: 1000, expense: -5000, profit: -4000, earmarkedIncome: 0, earmarkedExpense: 0, earmarkedProfit: 0},
                {start: '2017-06-03', end: '2017-06-30', month: 201706, income: 90, expense: -50, profit: 40, earmarkedIncome: 100, earmarkedExpense: -50, earmarkedProfit: 50},
                {start: '2017-07-01', end: '2017-07-31', month: 201707, income: 800, expense: -1550, profit: -750, earmarkedIncome: 0, earmarkedExpense: -600, earmarkedProfit: -600},
            ]);
        });

        it('should get income and expense grouped by month using arbitrary month start offset', async function() {
            assert.deepEqual(await analysisDao.incomeAndExpense(userId, 15, '2017-01-01'), [
                {start: '2017-05-31', end: '2017-06-03', month: 201706, income: 990, expense: -5000, profit: -4010, earmarkedIncome: 0, earmarkedExpense: 0, earmarkedProfit: 0},
                {start: '2017-06-30', end: '2017-07-15', month: 201707, income: 600, expense: -900, profit: -300, earmarkedIncome: 100, earmarkedExpense: -650, earmarkedProfit: -550},
                {start: '2017-07-31', end: '2017-07-31', month: 201708, income: 300, expense: -700, profit: -400, earmarkedIncome: 0, earmarkedExpense: 0, earmarkedProfit: 0},
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
                {date: '2017-06-03', profit: -10 + 100 + -50, earmarked: 0},
                {date: '2017-07-01', profit: 500 + 500 + -250, earmarked: 0},
                {date: '2017-07-31', profit: -700 + 300, earmarked: 0},
            ]);
        });

        it('should exclude scheduled transactions from daily profit and loss', async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500, recurEvery: 1, recurPeriod: 'MONTH'}));
            assert.deepEqual(await analysisDao.dailyProfitAndLoss(userId, '2017-06-01'), [
                {date: '2017-06-03', profit: -10 + 100 + -50, earmarked: 0},
                {date: '2017-07-01', profit: 500 + 500 + -250, earmarked: 0},
                {date: '2017-07-31', profit: -700 + 300, earmarked: 0},
            ]);
        });

        it('should calculate amount earmarked each day', async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', amount: 500, earmark: 'earmark1'}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', amount: 100, earmark: 'earmark1'}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', amount: -50, earmark: 'earmark2'}));
            assert.deepEqual(await analysisDao.dailyProfitAndLoss(userId, '2017-06-01'), [
                {date: '2017-06-03', profit: -10 + 100 + -50, earmarked: 0},
                {date: '2017-07-01', profit: 500 + 500 + 500 + -250, earmarked: 500},
                {date: '2017-07-31', profit: -700 + 300 + 100 + -50, earmarked: 50},
            ]);
        });
    });

    describe('Expense Breakdown', function() {
        let categoryDao;

        beforeEach(async function() {
            categoryDao = new CategoryDao(dbTestUtils.queryFunction(connection));
            await categoryDao.create(userId, {id: 1, name: 'Category 1'});
            await categoryDao.create(userId, {id: 2, name: 'Category 2'});
            await categoryDao.create(userId, {id: 3, name: 'Category 3'});
        });

        it('should calculate expense breakdown by category', async function() {
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'income', categoryId: 1, amount: 1000}));
            await transactionDao.create(userId, makeTransaction({date: '2017-05-31', type: 'expense', categoryId: 2, amount: -5000}));

            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'expense', categoryId: 1, amount: -10}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'income', categoryId: 2, amount: 100}));
            await transactionDao.create(userId, makeTransaction({date: '2017-06-03', type: 'expense', categoryId: 3, amount: -50}));

            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'income', categoryId: 1, amount: 500}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-01', type: 'expense', categoryId: 2, amount: -250}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'expense', categoryId: 3, amount: -700}));
            await transactionDao.create(userId, makeTransaction({date: '2017-07-31', type: 'income', categoryId: 2, amount: 300}));

            assert.deepEqual(await analysisDao.expenseBreakdown(userId, 31, '2017-06-01'), [
                {categoryId: "1", month: 201706, totalExpenses: -10},
                {categoryId: "2", month: 201707, totalExpenses: -250},
                {categoryId: "3", month: 201706, totalExpenses: -50},
                {categoryId: "3", month: 201707, totalExpenses: -700},
            ]);
        });
    });

    function makeTransaction(args, template = minimalTransaction) {
        return Object.assign({}, template, {id: idGenerator()}, args);
    }
});