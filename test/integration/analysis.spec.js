const Dsl = require('./dsl');

describe('Analysis', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.accounts.createAccount({alias: 'account1', date: '2017-05-31', balance: 0});
        await dsl.accounts.createAccount({alias: 'account2', date: '2017-05-31', balance: 0});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    describe('Income/Expense and Daily Balances', function() {
        beforeEach(async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1'});
            await dsl.earmarks.createEarmark({alias: 'earmark2'});
            await dsl.accounts.createAccount({alias: 'investment1', date: '2017-05-31', balance: 0, type: 'investment'});
            await dsl.accounts.createAccount({alias: 'investment2', date: '2017-05-31', balance: 0, type: 'investment'});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'transfer', toAccount: 'account2', amount: 1234});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'income', amount: 1000, earmark: 'earmark2'});
            await dsl.transactions.createTransaction({date: '2017-05-31', type: 'income', amount: 2000, earmark: 'earmark2'});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-05-31', type: 'expense', amount: -5000});

            await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'income', amount: -10});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-03', type: 'transfer', toAccount: 'account2', amount: 4444});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'income', amount: 100});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-06-30', type: 'expense', amount: -50});

            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'openingBalance', amount: 500});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'income', amount: 500, earmark: 'earmark1'});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-01', type: 'expense', amount: -250, earmark: 'earmark2'});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-15', type: 'expense', amount: -600});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'expense', amount: -700});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-07-31', type: 'income', amount: 300, earmark: 'earmark1'});
            await dsl.transactions.createTransaction({account: 'account1', date: '2017-08-15', type: 'transfer', toAccount: 'account2', amount: 9000});

            await dsl.transactions.createTransaction({account: 'account1', date: '2017-09-11', type: 'transfer', toAccount: 'investment1', amount: 5000});
            await dsl.transactions.createTransaction({account: 'investment1', date: '2017-09-12', type: 'transfer', toAccount: 'investment2', amount: 3000});
            await dsl.transactions.createTransaction({account: 'investment2', date: '2017-09-13', type: 'transfer', toAccount: 'account1', amount: 2000});
        });

        it('should get income and expense breakdown', async function() {
            await dsl.analysis.verifyIncomeAndExpense({
                after: '2017-05-01',
                monthEnd: 15,
                expected: [
                    {start: '2017-05-31', end: '2017-06-03', month: 201706, income: 990, expense: -5000, profit: -4010, earmarkedIncome: 3000, earmarkedExpense: 0, earmarkedProfit: 3000},
                    {start: '2017-06-30', end: '2017-07-15', month: 201707, income: 600, expense: -900, profit: -300, earmarkedIncome: 500, earmarkedExpense: -250, earmarkedProfit: 250},
                    {start: '2017-07-31', end: '2017-07-31', month: 201708, income: 300, expense: -700, profit: -400, earmarkedIncome: 300, earmarkedExpense: 0, earmarkedProfit: 300},
                    {start: '2017-09-11', end: '2017-09-13', month: 201709, income: 0, expense: 0, profit: 0, earmarkedIncome: -8000, earmarkedExpense: 5000, earmarkedProfit: -3000},
                ],
            });
        });

        it('should get daily balances', async function() {
            await dsl.analysis.verifyDailyBalances({
                expected: [
                    {date: '2017-05-31', balance: -4000, availableFunds: -7000, bestFit: -3781.35},
                    {date: '2017-06-03', balance: -4000 + -10, availableFunds: -7000 + -10, bestFit: -3792.54},
                    {date: '2017-06-30', balance: -4000 + -10 + 100 + -50, availableFunds: -7000 + -10 + 100 + -50, bestFit: -3893.25},
                    {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250, availableFunds: -7000 + -10 + 100 + -50 + 500, bestFit: -3896.98},
                    {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600, availableFunds: -7000 + -10 + 100 + -50 + 500 + -600, bestFit: -3949.2},
                    {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700, bestFit: -4008.88},
                    {
                        date: '2017-09-11', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000, 
                        bestFit: -4165.54
                    },
                    {
                        date: '2017-09-12', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000, 
                        bestFit: -4169.27
                    },
                    {
                        date: '2017-09-13', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000 - 2000, 
                        bestFit: -4173
                    },
                ],
            });
        });

        it('should get daily balances after a specified date', async function() {
            await dsl.analysis.verifyDailyBalances({
                after: '2017-05-31',
                expected: [
                    {date: '2017-06-03', balance: -4000 + -10, availableFunds: -7000 + -10, bestFit: -3696.51},
                    {date: '2017-06-30', balance: -4000 + -10 + 100 + -50, availableFunds: -7000 + -10 + 100 + -50, bestFit: -3829.62},
                    {date: '2017-07-01', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250, availableFunds: -7000 + -10 + 100 + -50 + 500, bestFit: -3834.55},
                    {date: '2017-07-15', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600, availableFunds: -7000 + -10 + 100 + -50 + 500 + -600, bestFit: -3903.57},
                    {date: '2017-07-31', balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700, bestFit: -3982.45},
                    {
                        date: '2017-09-11', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000, 
                        bestFit: -4189.51
                    },
                    {
                        date: '2017-09-12', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000, 
                        bestFit: -4194.44
                    },
                    {
                        date: '2017-09-13', 
                        balance: -4000 + -10 + 100 + -50 + 500 + 500 + -250 + -600 + -700 + 300,
                        availableFunds: -7000 + -10 + 100 + -50 + 500 + -600 + -700 + 5000 - 2000, 
                        bestFit: -4199.37
                    },
                ],
            });
        });
    });

    describe('Category Balances', function() {
        beforeEach(async function() {
            await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
            await dsl.categories.createCategory({alias: 'category2', name: 'Category 2'});
            await dsl.categories.createCategory({alias: 'category3', name: 'Category 3', parent: 'category1'});
        });

        it('should report balance by category', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account1', amount: 1000});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account1', amount: 500});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category2', account: 'account1', amount: 700});

            await dsl.analysis.verifyCategoryBalances({
                expected: [
                    {category: 'category1', balance: 1500},
                    {category: 'category2', balance: 700},
                ],
            });
        });

        it('should report balance by category while applying filters', async function() {
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account1', amount: 1000});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account1', amount: 500});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category2', account: 'account1', amount: 700});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category2', account: 'account2', amount: 700});
            await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account2', amount: 700});

            await dsl.analysis.verifyCategoryBalances({
                account: 'account1',
                expected: [
                    {category: 'category1', balance: 1500},
                    {category: 'category2', balance: 700},
                ],
            });
        });
    });
});