const Dsl = require('./dsl');

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

    describe('Line Items', function() {
        it('should create new budget line item', async function() {
            await dsl.budgets.setBudget({ earmark: 'earmark1', category: 'category1', amount: 500 });
            await dsl.budgets.verifyBudget({ earmark: 'earmark1', category: 'category1', amount: 500 })
        });
    });
});