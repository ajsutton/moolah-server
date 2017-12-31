const Dsl = require('./dsl');

describe('Analysis', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', date: '2017-05-31', balance: 0});
        await dsl.accounts.createAccount({alias: 'account2', date: '2017-05-31', balance: 0});


        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'transfer', toAccount: 'account2', amount: 1234});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'income', amount: 1000});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'expense', amount: -5000});

        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'income', amount: -10});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'transfer', toAccount: 'account2', amount: 4444});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'income', amount: 100});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'expense', amount: -50});

        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'openingBalance', amount: 500});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'income', amount: 500});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'expense', amount: -250});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-15', type: 'expense', amount: -600});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'expense', amount: -700});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'income', amount: 300});
        await dsl.transactions.createTransaction({account: 'account1', date: '2017-08-15', type: 'transfer', toAccount: 'account2', amount: 9000});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should get income and expense breakdown', async function() {
        await dsl.analysis.verifyIncomeAndExpense({
            after: '2017-05-01',
            monthEnd: 15,
            expected: [
                {start: '2017-05-31', end: '2017-06-03', month: 201706, income: 990, expense: -5000, profit: -4010},
                {start: '2017-06-30', end: '2017-07-15', month: 201707, income: 600, expense: -900, profit: -300},
                {start: '2017-07-31', end: '2017-07-31', month: 201708, income: 300, expense: -700, profit: -400},
            ],
        });
    });

    it('should get daily balances', async function() {
        await dsl.analysis.verifyDailyBalances({
            expected: [
                {date: '2017-05-31', balance: -4000, bestFit: -3853.92},
                {date: '2017-06-03', balance: -4000 + -10, bestFit: -3855.27},
                {date: '2017-06-30', balance: -4000 + -10 + 100 + -50, bestFit: -3867.42},
                {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250, bestFit: -3867.87},
                {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600, bestFit: -3874.17},
                {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300, bestFit: -3881.37},
            ]
        })
    });

    it('should get daily balances after a specified date', async function() {
        await dsl.analysis.verifyDailyBalances({
            after: '2017-05-31',
            expected: [
                {date: '2017-06-03', balance: -4000 + -10, bestFit: -3742.04},
                {date: '2017-06-30', balance: -4000 + -10 + 100 + -50, bestFit: -3827.36},
                {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250, bestFit: -3830.52},
                {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600, bestFit: -3874.76},
                {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300, bestFit: -3925.32},
            ]
        })
    });
});