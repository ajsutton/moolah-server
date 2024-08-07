import dbTestUtils from '../utils/dbTestUtils.js';
import AccountDao from '../../src/db/accountDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';

describe('Account DAO', function () {
  let connection;
  let userId;
  let accountDao;

  beforeEach(async function () {
    userId = idGenerator();
    connection = await dbTestUtils.createConnection();
    accountDao = new AccountDao(dbTestUtils.queryFunction(connection));
  });

  afterEach(async function () {
    await dbTestUtils.deleteData(userId, connection);
    connection.destroy();
  });

  it('should round trip accounts', async function () {
    const account = {
      id: '1',
      name: 'Account 1',
      type: 'bank',
      position: 7,
      hidden: false,
    };
    await accountDao.create(userId, account);
    const accounts = await accountDao.accounts(userId);
    assert.deepEqual(accounts, [account]);
  });

  it('should update existing accounts', async function () {
    const account = {
      id: '1',
      name: 'Account 1',
      type: 'bank',
      position: 3,
      hidden: false,
    };
    const modifiedAccount = {
      id: '1',
      name: 'New Account Name',
      type: 'cc',
      position: 5,
      hidden: true,
    };
    await accountDao.create(userId, account);
    await accountDao.store(userId, modifiedAccount);
    const accounts = await accountDao.accounts(userId);
    assert.deepEqual(accounts, [modifiedAccount]);
  });

  it('should get an account by id', async function () {
    const account = {
      id: '1',
      name: 'Account 1',
      type: 'bank',
      position: 5,
      hidden: false,
    };
    await accountDao.create(userId, account);
    const result = await accountDao.account(userId, account.id);
    assert.deepEqual(result, account);
  });

  it('should default position to 0', async function () {
    await accountDao.create(userId, {
      id: '1',
      name: 'Account 1',
      type: 'bank',
    });
    const result = await accountDao.account(userId, '1');
    assert.deepEqual(result, {
      id: '1',
      name: 'Account 1',
      type: 'bank',
      position: 0,
      hidden: false,
    });
  });

  it('should sort accounts by position then name', async function () {
    const account1 = {
      id: '1',
      name: 'Account 1',
      type: 'bank',
      position: 3,
      hidden: false,
    };
    const account2 = {
      id: '2',
      name: 'Account 2',
      type: 'bank',
      position: 1,
      hidden: false,
    };
    const account3 = {
      id: '3',
      name: 'B Account',
      type: 'bank',
      position: 5,
      hidden: false,
    };
    const account4 = {
      id: '4',
      name: 'A Account',
      type: 'bank',
      position: 5,
      hidden: false,
    };
    await Promise.all([
      accountDao.create(userId, account1),
      accountDao.create(userId, account2),
      accountDao.create(userId, account3),
      accountDao.create(userId, account4),
    ]);

    const accounts = await accountDao.accounts(userId);
    assert.deepEqual(accounts, [account2, account1, account4, account3]);
  });

  it('should return undefined when account does not exist', async function () {
    const result = await accountDao.account(userId, 'unknown-account');
    assert.isUndefined(result);
  });

  it('should not return accounts that belong to a different user', async function () {
    const account = { id: '1', name: 'Account 1', type: 'bank' };
    await accountDao.create(userId, account);
    assert.deepEqual(await accountDao.accounts('someOtherUser'), []);
    assert.isUndefined(await accountDao.account('someOtherUser', account.id));
  });
});
