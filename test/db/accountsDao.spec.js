const db = require('../../src/db/database');
const accountsDao = require('../../src/db/accountsDao');
const assert = require('chai').assert;

describe('Accounts DAO', function() {
    beforeEach(async function() {
        await db.query('DELETE FROM account');
    });

    it('should round trip accounts', async function() {
        const account = {id: 1, name: 'Account 1', type: 'bank', balance: 40000};
        await accountsDao.store(account);
        const accounts = await accountsDao.accounts();
        assert.deepEqual(accounts, [account]);
    });

    it('should update existing accounts', async function() {
        const account = {id: 1, name: 'Account 1', type: 'bank', balance: 40000};
        const modifiedAccount = {id: 1, name: 'New Account Name', type: 'cc', balance: 50000};
        await accountsDao.store(account);
        await accountsDao.store(modifiedAccount);
        const accounts = await accountsDao.accounts();
        assert.deepEqual(accounts, [modifiedAccount]);
    });

    it('should get an account by id', async function() {
        const account = {id: 1, name: 'Account 1', type: 'bank', balance: 40000};
        await accountsDao.store(account);
        const result = await accountsDao.account(account.id);
        assert.deepEqual(result, account);
    });

    it('should return undefined when account does not exist', async function() {
        const result = await accountsDao.account(1);
        assert.isUndefined(result);
    });
});