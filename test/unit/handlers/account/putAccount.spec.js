import sinon from 'sinon';
import { assert } from 'chai';
import { create as serverFactory } from '../../../../src/server.js';
import idGenerator from '../../../../src/utils/idGenerator.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';

describe('Put Account Handler', function () {
  let server;
  let userId;
  let daos;

  beforeEach(async function () {
    userId = idGenerator();
    daos = dbTestUtils.stubDaos();
    server = await serverFactory();
  });

  afterEach(function () {
    dbTestUtils.restoreDaos();
    return server.stop();
  });

  it('should return 404 when account does not exist', async function () {
    daos.accounts.account.resolves(undefined);
    const response = await makeRequest(123, {
      name: 'Updated account',
      type: 'cc',
    });
    assert.equal(response.statusCode, 404);
  });

  it('should update existing account', async function () {
    const modifiedAccount = {
      id: 123,
      name: 'Updated account',
      type: 'cc',
      balance: 50000,
    };
    daos.accounts.account.withArgs(userId, '123').resolves({
      id: 123,
      name: 'Original account',
      type: 'bank',
      balance: 45000,
    });
    daos.transactions.balance
      .withArgs(userId, { accountId: 123 })
      .resolves(50000);
    const response = await makeRequest(123, {
      name: 'Updated account',
      type: 'cc',
    });
    assert.equal(response.statusCode, 200);
    sinon.assert.calledOnce(daos.accounts.store);
    sinon.assert.calledWith(daos.accounts.store, userId, modifiedAccount);
  });

  function makeRequest(accountId, payload) {
    return server.inject({
      url: `/api/accounts/${encodeURIComponent(accountId)}/`,
      method: 'PUT',
      payload: payload,
      auth: {
        strategy: 'cookie',
        credentials: {
          userId,
        },
      },
    });
  }
});
