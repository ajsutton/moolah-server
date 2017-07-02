const sinon = require('sinon');
const assert = require('chai').assert;
const serverFactory = require('../../../../src/server');
const accountDao = require('../../../../src/db/accountDao');
const transactionDao = require('../../../../src/db/transactionDao');
const idGenerator = require('../../../../src/utils/idGenerator');

describe('Put Account Handler', function() {
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountDao, 'account');
        sinon.spy(accountDao, 'store');
        sinon.stub(accountDao, 'create');
        sinon.stub(transactionDao, 'get');
        sinon.stub(transactionDao, 'store');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountDao.account.restore();
        accountDao.store.restore();
        accountDao.create.restore();
        transactionDao.get.restore();
        transactionDao.store.restore();
        return server.stop();
    });

    it('should return 404 when account does not exist', async function() {
        accountDao.account.resolves(undefined);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 404);
    });

    it('should update existing account', async function() {
        const modifiedAccount = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        accountDao.account.withArgs(userId, '123').resolves({id: 123, name: 'Original account', type: 'bank', balance: 45000});
        const openingBalanceTransaction = {id: 123, amount: 45000};
        transactionDao.get.withArgs(userId, 123).resolves(openingBalanceTransaction);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 200);
        sinon.assert.calledOnce(accountDao.store);
        sinon.assert.calledWith(accountDao.store, userId, modifiedAccount);
        sinon.assert.calledOnce(transactionDao.store);
        sinon.assert.calledWith(transactionDao.store, userId, Object.assign(openingBalanceTransaction, {balance: 20000}));
    });


    function makeRequest(accountId, payload) {
        return new Promise((resolve, reject) => {
            server.inject({
                    url: `/api/accounts/${encodeURIComponent(accountId)}/`,
                    method: 'PUT',
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