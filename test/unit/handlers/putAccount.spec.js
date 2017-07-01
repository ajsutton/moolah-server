const sinon = require('sinon');
const assert = require('chai').assert;
const serverFactory = require('../../../src/server');
const accountDao = require('../../../src/db/accountDao');
const idGenerator = require('../../../src/utils/idGenerator');

describe('Put Account Handler', function() {
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountDao, 'account');
        sinon.spy(accountDao, 'store');
        sinon.stub(accountDao, 'create');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountDao.account.restore();
        accountDao.store.restore();
        accountDao.create.restore();
        return server.stop();
    });

    it('should return 404 when account does not exist', async function() {
        accountDao.account.returns(undefined);
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 404);
    });

    it('should update existing account', async function() {
        const modifiedAccount = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        accountDao.account.withArgs(userId, '123').returns({id: 123, name: 'Original account', type: 'bank', balance: 45000});
        const response = await makeRequest(123, {name: 'Updated account', type: 'cc', balance: 20000});
        assert.equal(response.statusCode, 200);
        sinon.assert.calledOnce(accountDao.store);
        sinon.assert.calledWith(accountDao.store, userId, modifiedAccount);
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