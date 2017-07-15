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

    it('should create and list categories', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2'});
        await dsl.categories.createCategory({alias: 'category3', name: 'Category 3', parent: 'category1'});

        await dsl.categories.verifyCategories({categories: ['category1', 'category2', 'category3']});
    });

    it('should update categories', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2'});

        await dsl.categories.modifyCategory({alias: 'category1', name: 'New Name', parent: 'category1'});


        await dsl.categories.verifyCategories({categories: ['category2', 'category1']});
    });

    it('should not return 404 when attempting to update a category that does not exist', async function() {
        await dsl.categories.modifyCategory({alias: 'category1', name: 'New Name', statusCode: 404});
    });

    it('should get individual category', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.verifyCategory({alias: 'category1'});
    });

    it('should create a category with a parent', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2', parent: 'category1'});

        await dsl.categories.verifyCategories({categories: ['category1', 'category2']});
    });

    it('should reject creating a category with a parent that does not exist', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category', parent: '<foo>', statusCode: 400});
    });
});