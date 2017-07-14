const Dsl = require('./dsl');

describe('Account Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    it('should list categories', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2'});
        await dsl.categories.createCategory({alias: 'category3', name: 'Category 3', parent: 'category1'});

        await dsl.categories.verifyCategories({categories: [ 'category1', 'category2', 'category3']});
    });
});