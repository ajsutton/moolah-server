const db = require('../../src/db/database');
const dbTestUtils = require('../utils/dbTestUtils');
const accountDao = require('../../src/db/accountDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Account DAO', function() {
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId);
    });

    it('should round trip accounts', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountDao.create(userId, account);
        const accounts = await accountDao.accounts(userId);
        assert.deepEqual(accounts, [account]);
    });

    it('should update existing accounts', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        const modifiedAccount = {id: '1', name: 'New Account Name', type: 'cc', balance: 50000};
        await accountDao.create(userId, account);
        await accountDao.store(userId, modifiedAccount);
        const accounts = await accountDao.accounts(userId);
        assert.deepEqual(accounts, [modifiedAccount]);
    });

    it('should get an account by id', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountDao.create(userId, account);
        const result = await accountDao.account(userId, account.id);
        assert.deepEqual(result, account);
    });

    it('should return undefined when account does not exist', async function() {
        const result = await accountDao.account(userId, 'unknown-account');
        assert.isUndefined(result);
    });

    it('should not return accounts that belong to a different user', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountDao.create(userId, account);
        assert.deepEqual(await accountDao.accounts('someOtherUser'), []);
        assert.isUndefined(await accountDao.account('someOtherUser', account.id));
    });
});