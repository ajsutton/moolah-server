import Dsl from './dsl/index.js';

describe('Earmark Budgets', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
        await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
        await dsl.categories.createCategory({alias: 'category1'});
    });

    afterEach(function() {
        return dsl.tearDown();
    });

        it('should create new budget line item', async function() {
            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
            await dsl.budgets.verifyBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
        });

        it('should update budget line items', async function() {
            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
            await dsl.budgets.verifyBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
            
            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category1', amount: 700 });
            await dsl.budgets.verifyBudget({ earmark: 'earmark1', category: 'category1', amount: 700 });
        });

        it('should return all earmark budget items', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark2'});
            await dsl.categories.createCategory({alias: 'category2'});

            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category2', amount: 600 });
            await dsl.budgets.setBudget({ earmark: 'earmark2', category: 'category1', amount: 200 });

            await dsl.budgets.verifyBudgets({
                earmark: 'earmark1',
                budgets: { 'category1': 500, 'category2': 600 },
            });
        });

        it('should return empty object when earmark has no budgets', async function() {
            await dsl.budgets.verifyBudgets({
                earmark: 'earmark1',
                budgets: {},
            });
        });
});