const sinon = require('sinon');
const assert = require('chai').assert;
const BoomOutput = require('../../../utils/boomOutput');
const serverFactory = require('../../../../src/server');
const accountDao = require('../../../../src/db/accountDao');
const transactionDao = require('../../../../src/db/transactionDao');
const idGenerator = require('../../../../src/utils/idGenerator');

describe('Create Transaction Handler', function() {
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountDao, 'account');
        sinon.stub(transactionDao, 'create');
        sinon.stub(transactionDao, 'get');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountDao.account.restore();
        transactionDao.create.restore();
        transactionDao.get.restore();
        return server.stop();
    });

    it('should return bad request when account does not exist', async function() {
        accountDao.account.resolves(undefined);
        const response = await makeRequest(123, {
            type: 'expense',
            date: new Date(Date.UTC(2017, 6, 4)),
            accountId: 'any-account',
            amount: 5000,
        });
        assert.equal(response.statusCode, 400);
        assert.deepEqual(response.payload, BoomOutput.badRequest('Invalid account'));
        sinon.assert.calledOnce(accountDao.account); // Double check we got that far.
    });

    it('should create transaction', async function() {
        const transaction = {
            type: 'expense',
            date: '2017-06-04',
            accountId: 'any-account',
            amount: 5000,
        };
        const account = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        accountDao.account.withArgs(userId, 'any-account').returns(account);
        const response = await makeRequest(transaction);
        assert.equal(response.statusCode, 201);
        const newTransactionId = transactionDao.create.firstCall.args[1].id;
        assert.equal(response.headers.location, `/transactions/${encodeURIComponent(newTransactionId)}/`);
        sinon.assert.calledOnce(transactionDao.create);
        sinon.assert.calledWithMatch(transactionDao.create, userId, transaction);
    });

    it('should generate a new id when database reports a conflict', async function() {
        const transaction = {
            type: 'expense',
            date: '2017-06-04',
            accountId: 'any-account',
            amount: 5000,
        };
        const account = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        accountDao.account.withArgs(userId, 'any-account').returns(account);
        transactionDao.create.onCall(0).rejects({code: 'ER_DUP_ENTRY'});
        transactionDao.create.onCall(1).resolves(null);
        const response = await makeRequest(transaction);
        assert.equal(response.statusCode, 201);


        sinon.assert.calledTwice(transactionDao.create);
        assert.notEqual(transactionDao.create.firstCall.args[1].id, transactionDao.create.secondCall.args[1].id);
    });

    function makeRequest(payload) {
        return new Promise((resolve) => {
            server.inject({
                    url: `/api/transactions/`,
                    method: 'POST',
                    payload: payload,
                    credentials: {
                        userId,
                    },
                },
                function(response) {
                    resolve(response);
                });
        });
    }
});