const serverFactory = require('../../../../src/server');
const assert = require('chai').assert;
const sinon = require('sinon');
const idGenerator = require('../../../../src/utils/idGenerator');
const dbTestUtils = require('../../../utils/dbTestUtils');

describe('Create Account Handler', function() {
    const options = {
        url: '/api/accounts/',
        method: 'POST',
    };
    let server;
    let userId;
    let daos;
    let accountDao;
    let transactionDao;

    beforeEach(async function() {
        userId = idGenerator();
        daos = dbTestUtils.stubDaos();
        accountDao = daos.accounts;
        transactionDao = daos.transactions;
        server = await serverFactory.create();
    });

    afterEach(function() {
        dbTestUtils.restoreDaos();
        return server.stop();
    });

    it('should create an account with a unique id', async function() {
        accountDao.create.resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);
        const accountId = JSON.parse(response.payload).id;

        sinon.assert.calledWithMatch(accountDao.create, userId, {id: accountId, name: 'Account 1', type: 'cc'});
        assert.isUndefined(accountDao.create.firstCall.args[1].balance);
        sinon.assert.calledWithMatch(transactionDao.create, userId, {
            id: accountId,
            accountId: accountId,
            amount: 40000,
            type: 'openingBalance',
        });
    });

    it('should generate a new id when database reports a conflict', async function() {
        accountDao.create.onCall(0).rejects({code: 'ER_DUP_ENTRY'});
        accountDao.create.onCall(1).resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);

        sinon.assert.calledTwice(accountDao.create);
        sinon.assert.calledOnce(transactionDao.create);
        assert.notEqual(accountDao.create.firstCall.args[1].id, accountDao.create.secondCall.args[1].id);
    });

    it('should specify user id when creating account', async function() {
        accountDao.create.resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);

        assert.equal(accountDao.create.firstCall.args[0], userId);
    });

    function makeRequest(payload) {
        return server.inject(Object.assign({}, options, {
            payload: payload,
            credentials: {
                userId,
            },
        }));
    }
});