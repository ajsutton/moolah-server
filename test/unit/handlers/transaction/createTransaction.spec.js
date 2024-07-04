import sinon from 'sinon';
import { assert } from 'chai';
import BoomOutput from '../../../utils/boomOutput.js';
import { create as serverFactory } from '../../../../src/server.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';
import idGenerator from '../../../../src/utils/idGenerator.js';

describe('Create Transaction Handler', function () {
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

  it('should return bad request when account does not exist', async function () {
    daos.accounts.account.resolves(undefined);
    const response = await makeRequest({
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    });
    assert.equal(response.statusCode, 400);
    assert.deepEqual(
      response.payload,
      BoomOutput.badRequest('Invalid accountId')
    );
    sinon.assert.calledOnce(daos.accounts.account); // Double check we got that far.
  });

  it('should create transaction', async function () {
    const transaction = {
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    };
    const account = {
      id: 123,
      name: 'Updated account',
      type: 'cc',
      balance: 20000,
    };
    daos.accounts.account.withArgs(userId, 'any-account').resolves(account);
    const response = await makeRequest(transaction);
    assert.equal(response.statusCode, 201);
    const newTransactionId = daos.transactions.create.firstCall.args[1].id;
    assert.equal(
      response.headers.location,
      `/transactions/${encodeURIComponent(newTransactionId)}/`
    );
    sinon.assert.calledOnce(daos.transactions.create);
    sinon.assert.calledWithMatch(daos.transactions.create, userId, {
      id: newTransactionId,
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    });
  });

  it('should create transaction with all fields', async function () {
    const transaction = {
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
      payee: 'Ralph',
      notes: 'Some notes',
    };
    const account = {
      id: 123,
      name: 'Updated account',
      type: 'cc',
      balance: 20000,
    };
    daos.accounts.account.withArgs(userId, 'any-account').resolves(account);
    const response = await makeRequest(transaction);
    assert.equal(response.statusCode, 201);
    const newTransactionId = daos.transactions.create.firstCall.args[1].id;
    assert.equal(
      response.headers.location,
      `/transactions/${encodeURIComponent(newTransactionId)}/`
    );
    sinon.assert.calledOnce(daos.transactions.create);
    sinon.assert.calledWithMatch(daos.transactions.create, userId, {
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    });
  });

  it('should generate a new id when database reports a conflict', async function () {
    const transaction = {
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    };
    const account = {
      id: 123,
      name: 'Updated account',
      type: 'cc',
      balance: 20000,
    };
    daos.accounts.account.withArgs(userId, 'any-account').resolves(account);
    daos.transactions.create.onCall(0).rejects({ code: 'ER_DUP_ENTRY' });
    daos.transactions.create.onCall(1).resolves(null);
    const response = await makeRequest(transaction);
    assert.equal(response.statusCode, 201);

    sinon.assert.calledTwice(daos.transactions.create);
    assert.notEqual(
      daos.transactions.create.firstCall.args[1].id,
      daos.transactions.create.secondCall.args[1].id
    );
  });

  ['type', 'date', 'amount'].forEach(requiredField => {
    const validTransaction = {
      type: 'expense',
      date: '2017-06-04',
      accountId: 'any-account',
      amount: 5000,
    };
    it(`should require ${requiredField}`, async function () {
      const account = {
        id: 123,
        name: 'Updated account',
        type: 'cc',
        balance: 20000,
      };
      daos.accounts.account.withArgs(userId, 'any-account').resolves(account);
      const transaction = Object.assign({}, validTransaction);
      transaction[requiredField] = undefined;
      const response = await makeRequest(transaction);
      assert.equal(response.statusCode, 400);
      assert.deepEqual(JSON.parse(response.payload), {
        statusCode: 400,
        error: 'Bad Request',
        message: `"${requiredField}" is required`,
        validation: { source: 'payload', keys: [requiredField] },
      });
    });
  });

  function makeRequest(payload) {
    return server.inject({
      url: `/api/transactions/`,
      method: 'POST',
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
