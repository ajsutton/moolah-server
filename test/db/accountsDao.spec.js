const db = require('../../src/db/database');
const accountsDao = require('../../src/db/accountsDao');
const assert = require('chai').assert;

describe('Accounts DAO', function() {
    let userId;

    beforeEach(async function() {
        userId = 'accountsDao-' + Math.random();
    });

    it('should round trip accounts', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountsDao.create(userId, account);
        const accounts = await accountsDao.accounts(userId);
        assert.deepEqual(accounts, [account]);
    });

    it('should update existing accounts', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        const modifiedAccount = {id: '1', name: 'New Account Name', type: 'cc', balance: 50000};
        await accountsDao.create(userId, account);
        await accountsDao.store(userId, modifiedAccount);
        const accounts = await accountsDao.accounts(userId);
        assert.deepEqual(accounts, [modifiedAccount]);
    });

    it('should get an account by id', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountsDao.create(userId, account);
        const result = await accountsDao.account(userId, account.id);
        assert.deepEqual(result, account);
    });

    it('should return undefined when account does not exist', async function() {
        const result = await accountsDao.account(userId, 'unknown-account');
        assert.isUndefined(result);
    });

    it('should not return accounts that belong to a different user', async function() {
        const account = {id: '1', name: 'Account 1', type: 'bank', balance: 40000};
        await accountsDao.create(userId, account);
        assert.deepEqual(await accountsDao.accounts('someOtherUser'), []);
        assert.isUndefined(await accountsDao.account('someOtherUser', account.id));
    });
});