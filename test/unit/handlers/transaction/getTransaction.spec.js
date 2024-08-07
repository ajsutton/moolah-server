import { assert } from 'chai';
import BoomOutput from '../../../utils/boomOutput.js';
import { create as serverFactory } from '../../../../src/server.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';
import idGenerator from '../../../../src/utils/idGenerator.js';

describe('Get Transaction Handler', function () {
  let server;
  let userId;
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

  it('should return not found when transaction does not exist', async function () {
    daos.transactions.transaction
      .withArgs(userId, transaction.id)
      .resolves(undefined);
    const response = await makeRequest(transaction.id);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(
      response.payload,
      BoomOutput.notFound('Transaction not found')
    );
  });

  it('should return the transaction when it exists', async function () {
    daos.transactions.transaction
      .withArgs(userId, transaction.id)
      .resolves(transaction);
    const response = await makeRequest(transaction.id);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, JSON.stringify(transaction));
  });

  function makeRequest(transactionId) {
    return server.inject({
      url: `/api/transactions/${encodeURIComponent(transactionId)}/`,
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
