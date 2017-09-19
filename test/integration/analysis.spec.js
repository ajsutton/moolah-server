const Dsl = require('./dsl');

describe('Analysis', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', date: '2017-05-31', balance: 0});


        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'transfer', toAccountId: 'account2', amount: 1234});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'income', amount: 1000});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'expense', amount: -5000});

        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'income', amount: -10});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'transfer', toAccountId: 'account2', amount: 4444});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'income', amount: 100});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'expense', amount: -50});

        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'openingBalance', amount: 500});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'income', amount: 500});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'expense', amount: -250});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-15', type: 'expense', amount: -600});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'expense', amount: -700});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'income', amount: 300});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-08-15', type: 'transfer', toAccountId: 'account2', amount: 9000});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should get income and expense breakdown', async function() {
        await dsl.analysis.verifyIncomeAndExpense({
            after: '2017-05-01',
            monthEnd: 15,
            expected: [
                {start: '2017-05-31', end: '2017-06-03', income: 990, expense: -5000, profit: -4010},
                {start: '2017-06-30', end: '2017-07-15', income: 600, expense: -900, profit: -300},
                {start: '2017-07-31', end: '2017-07-31', income: 300, expense: -700, profit: -400},
            ],
        });
    });

    it('should get daily balances', async function() {
        await dsl.analysis.verifyDailyBalances({
            expected: [
                {date: '2017-05-31', balance: -4000},
                {date: '2017-06-03', balance: -4000 + -10},
                {date: '2017-06-30', balance: -4000 + -10 + 100 + -50},
                {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250},
                {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600},
                {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300},
            ]
        })
    });

    it('should get daily balances after a specified date', async function() {
        await dsl.analysis.verifyDailyBalances({
            after: '2017-05-31',
            expected: [
                {date: '2017-06-03', balance: -4000 + -10},
                {date: '2017-06-30', balance: -4000 + -10 + 100 + -50},
                {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250},
                {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600},
                {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300},
            ]
        })
    });
});