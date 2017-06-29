const sinon = require('sinon');
const assert = require('chai').assert;
const serverFactory = require('../../../src/server');
const accountsDao = require('../../../src/db/accountsDao');
const idGenerator = require('../../../src/utils/idGenerator');

describe('Put Account Handler', function() {
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountsDao, 'account');
        sinon.spy(accountsDao, 'store');
        sinon.stub(accountsDao, 'create');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountsDao.account.restore();
        accountsDao.store.restore();
        accountsDao.create.restore();
        return server.stop();
    });

    it('should return 404 when account does not exist', async function() {
        accountsDao.account.returns(undefined);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 404);
    });

    it('should update existing account', async function() {
        const modifiedAccount = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        accountsDao.account.withArgs(userId, '123').returns({id: 123, name: 'Original account', type: 'bank', balance: 45000});
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 200);
        sinon.assert.calledOnce(accountsDao.store);
        sinon.assert.calledWith(accountsDao.store, userId, modifiedAccount);
    });


    function makeRequest(accountId, payload) {
        return new Promise((resolve, reject) => {
            server.inject({
                    url: `/accounts/${encodeURIComponent(accountId)}/`,
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