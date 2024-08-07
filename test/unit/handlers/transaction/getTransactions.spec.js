import { assert } from 'chai';
import BoomOutput from '../../../utils/boomOutput.js';
import { create as serverFactory } from '../../../../src/server.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';
import idGenerator from '../../../../src/utils/idGenerator.js';

describe('Get Transactions Handler', function () {
  let server;
  let userId;
  const accountId = 'abc-def-ghi';
  let daos;
  const transaction = {
    id: 'abc-id',
    type: 'expense',
    date: '2017-06-04',
    accountId: 'any-account',
    amount: 5000,
  };

  beforeEach(async function () {
    userId = idGenerator();
    daos = dbTestUtils.stubDaos();
    server = await serverFactory();
  });

  afterEach(function () {
    dbTestUtils.restoreDaos();
    return server.stop();
  });

  it('should return not found when account does not exist', async function () {
    daos.accounts.account.withArgs(userId, accountId).resolves(undefined);
    const response = await makeRequest(accountId);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(
      response.payload,
      BoomOutput.notFound('Account not found')
    );
  });

  it('should return the transaction when it exists', async function () {
    daos.accounts.account
      .withArgs(userId, accountId)
      .resolves({ id: accountId });
    daos.transactions.transactions
      .withArgs(userId, {
        accountId: accountId,
        scheduled: false,
        from: undefined,
        to: undefined,
        categories: [],
        earmarkId: undefined,
        transactionType: undefined,
        payee: undefined,
      })
      .resolves([transaction]);
    const response = await makeRequest(accountId);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      response.payload,
      JSON.stringify({
        transactions: [transaction],
        hasMore: false,
        priorBalance: 0,
      })
    );
  });

  function makeRequest(accountId) {
    return server.inject({
      url: `/api/transactions/?account=${encodeURIComponent(accountId)}`,
      method: 'GET',
      auth: {
        strategy: 'cookie',
        credentials: {
          userId,
        },
      },
    });
  }
});
