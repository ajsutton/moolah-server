const sinon = require('sinon');
const assert = require('chai').assert;
const serverFactory = require('../../../../src/server');
const idGenerator = require('../../../../src/utils/idGenerator');
const dbTestUtils = require('../../../utils/dbTestUtils');

describe('Put Account Handler', function() {
    let server;
    let userId;
    let daos;

    beforeEach(async function() {
        userId = idGenerator();
        daos = dbTestUtils.stubDaos();
        server = await serverFactory.create();
    });

    afterEach(function() {
        dbTestUtils.restoreDaos();
        return server.stop();
    });

    it('should return 404 when account does not exist', async function() {
        daos.accounts.account.resolves(undefined);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 404);
    });

    it('should update existing account', async function() {
        const modifiedAccount = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        daos.accounts.account.withArgs(userId, '123').resolves({id: 123, name: 'Original account', type: 'bank', balance: 45000});
        const openingBalanceTransaction = {id: 123, amount: 45000};
        daos.transactions.transaction.withArgs(userId, 123).resolves(openingBalanceTransaction);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 200);
        sinon.assert.calledOnce(daos.accounts.store);
        sinon.assert.calledWith(daos.accounts.store, userId, modifiedAccount);
        sinon.assert.calledOnce(daos.transactions.store);
        sinon.assert.calledWith(daos.transactions.store, userId, Object.assign(openingBalanceTransaction, {balance: 20000}));
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