import db from '../../src/db/database.js';
import dbTestUtils from '../utils/dbTestUtils.js';
import CategoryDao from '../../src/db/categoryDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';

describe('Category Dao', function() {
    let connection;
    let categoryDao;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        connection = await dbTestUtils.createConnection();
        categoryDao = new CategoryDao(dbTestUtils.queryFunction(connection));
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId, connection);
        connection.destroy();
    });

    it('should round trip a top-level category', async function() {
        const category = {
            id: 'category1',
            name: 'New Category',
        };
        await categoryDao.create(userId, category);
        const result = await categoryDao.category(userId, category.id);
        assert.deepEqual(result, category);
    });

    it('should round trip a sub-category', async function() {
        const category = {
            id: 'child',
            name: 'Child',
            parentId: 'parent'
        };
        await categoryDao.create(userId, {id: 'parent', name: 'New Category'});
        await categoryDao.create(userId, category);
        const result = await categoryDao.category(userId, category.id);
        assert.deepEqual(result, category);
    });

    it('should return undefined when a category does not exist', async function() {
        const result = await categoryDao.category(userId, 'foo');
        assert.isUndefined(result);
    });

    it('should return undefined when a category belongs to a different user', async function() {
        const category = {
            id: 'category1',
            name: 'New Category',
        };
        await categoryDao.create(userId, category);
        const result = await categoryDao.category('someone else', category.id);
        assert.isUndefined(result);
    });

    it('should list all categories for user', async function() {
        const category1 = {id: '1', name: 'aCat1'};
        const category2 = {id: '2', name: 'cCat2'};
        const category3 = {id: '3', name: 'bCat3', parentId: '1'};
        await categoryDao.create(userId, category1);
        await categoryDao.create(userId, category2);
        await categoryDao.create(userId, category3);
        const result = await categoryDao.categories(userId);
        assert.deepEqual(result, [category1, category3, category2]);
    });

    it('should not list categories belonging to a different user', async function() {
        const category1 = {id: '1', name: 'aCat1'};
        const category2 = {id: '2', name: 'cCat2'};
        const category3 = {id: '3', name: 'bCat3', parentId: '1'};
        await categoryDao.create(userId, category1);
        await categoryDao.create(userId, category2);
        await categoryDao.create(userId, category3);
        assert.deepEqual(await categoryDao.categories('someone else'), []);
    });

    it('should update category', async function() {
        const category1 = {id: '1', name: 'Cat1'};
        const category2 = {id: '2', name: 'Cat2', parentId: '1'};
        await categoryDao.create(userId, category1);
        await categoryDao.create(userId, category2);

        await categoryDao.store(userId, {id: '2', name: 'New Name'});
        assert.deepEqual(await categoryDao.category(userId, '2'), {id: '2', name: 'New Name'})
    });
});