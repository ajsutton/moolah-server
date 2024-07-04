import dbTestUtils from '../utils/dbTestUtils.js';
import EarmarkDao from '../../src/db/earmarkDao.js';
import TransactionDao from '../../src/db/transactionDao.js';
import AccountsDao from '../../src/db/accountDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';
import { makeTransaction } from './transactionHelper.js';

describe('Earmark DAO', function () {
  let connection;
  let userId;
  let earmarkDao;
  let transactionDao;
  let accountsDao;

  beforeEach(async function () {
    userId = idGenerator();
    connection = await dbTestUtils.createConnection();
    earmarkDao = new EarmarkDao(dbTestUtils.queryFunction(connection));
    transactionDao = new TransactionDao(dbTestUtils.queryFunction(connection));
    accountsDao = new AccountsDao(dbTestUtils.queryFunction(connection));
  });

  afterEach(async function () {
    await dbTestUtils.deleteData(userId, connection);
    connection.destroy();
  });

  it('should round trip earmark', async function () {
    const earmark = { id: '1', name: 'Earmark 1', position: 7, hidden: false };
    await earmarkDao.create(userId, earmark);
    const earmarks = await earmarkDao.earmarks(userId);
    assert.deepEqual(earmarks, [earmark]);
  });

  it('should update existing earmarks', async function () {
    const earmark = { id: '1', name: 'Earmark 1', position: 3, hidden: false };
    const modifiedEarmark = {
      id: '1',
      name: 'New Earmark Name',
      position: 5,
      hidden: true,
    };
    await earmarkDao.create(userId, earmark);
    await earmarkDao.store(userId, modifiedEarmark);
    const earmarks = await earmarkDao.earmarks(userId);
    assert.deepEqual(earmarks, [modifiedEarmark]);
  });

  it('should get an earmark by id', async function () {
    const earmark = { id: '1', name: 'Earmark 1', position: 5, hidden: false };
    await earmarkDao.create(userId, earmark);
    const result = await earmarkDao.earmark(userId, earmark.id);
    assert.deepEqual(result, earmark);
  });

  it('should default position to 0', async function () {
    await earmarkDao.create(userId, { id: '1', name: 'Earmark 1' });
    const result = await earmarkDao.earmark(userId, '1');
    assert.deepEqual(result, {
      id: '1',
      name: 'Earmark 1',
      position: 0,
      hidden: false,
    });
  });

  it('should sort earmarks by position then name', async function () {
    const earmark1 = { id: '1', name: 'Earmark 1', position: 3, hidden: false };
    const earmark2 = { id: '2', name: 'Earmark 2', position: 1, hidden: false };
    const earmark3 = { id: '3', name: 'B Earmark', position: 5, hidden: false };
    const earmark4 = { id: '4', name: 'A Earmark', position: 5, hidden: false };
    await Promise.all([
      earmarkDao.create(userId, earmark1),
      earmarkDao.create(userId, earmark2),
      earmarkDao.create(userId, earmark3),
      earmarkDao.create(userId, earmark4),
    ]);

    const earmarks = await earmarkDao.earmarks(userId);
    assert.deepEqual(earmarks, [earmark2, earmark1, earmark4, earmark3]);
  });

  it('should return undefined when earmark does not exist', async function () {
    const result = await earmarkDao.earmark(userId, 'unknown-earmark');
    assert.isUndefined(result);
  });

  it('should not return earmarks that belong to a different user', async function () {
    const earmark = { id: '1', name: 'Earmark 1' };
    await earmarkDao.create(userId, earmark);
    assert.deepEqual(await earmarkDao.earmarks('someOtherUser'), []);
    assert.isUndefined(await earmarkDao.earmark('someOtherUser', earmark.id));
  });

  describe('Earmark Balances', function () {
    beforeEach(async function () {
      await earmarkDao.create(userId, { id: '1', name: 'Earmark 1' });
      await accountsDao.create(userId, {
        id: 'account1',
        name: 'My Account',
        type: 'bank',
      });
    });

    it('should calculate net balance, savings and spent amount', async function () {
      await transactionDao.create(
        userId,
        makeTransaction({
          earmark: '1',
          type: 'income',
          amount: 5000,
          accountId: null,
        })
      );
      await transactionDao.create(
        userId,
        makeTransaction({
          earmark: '1',
          type: 'income',
          amount: 300,
          accountId: 'account1',
        })
      );
      await transactionDao.create(
        userId,
        makeTransaction({
          earmark: '1',
          type: 'expense',
          amount: -4000,
          accountId: 'account1',
        })
      );
      await transactionDao.create(
        userId,
        makeTransaction({
          earmark: '1',
          type: 'expense',
          amount: -1000,
          accountId: 'account1',
        })
      );

      const result = await earmarkDao.balances(userId, '1');
      assert.deepEqual(result, { balance: 300, saved: 5300, spent: -5000 });
    });
  });
});
