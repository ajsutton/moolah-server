const Dsl = require('./dsl');

describe('Category Management', function() {
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

    it('should reject updating a category when new parent category does not exist', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});

        await dsl.categories.modifyCategory({alias: 'category1', parent: '<foo>', statusCode: 400});
    });

    it('should remove parent category', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2', parent: 'category1'});

        await dsl.categories.modifyCategory({alias: 'category2', parent: null});
        await dsl.categories.verifyCategories({categories: ['category1', 'category2']});
    });

    it('should delete categories', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2'});

        await dsl.categories.deleteCategory({alias: 'category2'});
        await dsl.categories.verifyCategories({categories: ['category1']});
    });

    it('should move child categories to top level when parent is deleted', async function() {
        await dsl.categories.createCategory({alias: 'category1', name: 'Category 1'});
        await dsl.categories.createCategory({alias: 'category2', name: 'Category 2', parent: 'category1'});

        await dsl.categories.deleteCategory({alias: 'category1'});
        await dsl.categories.verifyCategory({alias: 'category2', parent: null});
    });

    it('should remove deleted categories from transactions', async function() {
        await dsl.categories.createCategory({alias: 'category1'});
        await dsl.accounts.createAccount({alias: 'account'});
        await dsl.transactions.createTransaction({alias: 'transaction', category: 'category1', account: 'account'});

        await dsl.categories.deleteCategory({alias: 'category1'});
        await dsl.transactions.verifyTransaction({alias: 'transaction', category: null});
    });
});