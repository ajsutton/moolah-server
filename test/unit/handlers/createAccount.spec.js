const serverFactory = require('../../../src/server');
const assert = require('chai').assert;
const sinon = require('sinon');
const accountsDao = require('../../../src/db/accountsDao');
const idGenerator = require('../../../src/utils/idGenerator');

describe('Create Account Handler', function() {
    const options = {
        url: '/api/accounts/',
        method: 'POST',
    };
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountsDao, 'create');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountsDao.create.restore();
        return server.stop();
    });

    it('should create an account with a unique id', async function() {
        accountsDao.create.resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);
    });

    it('should generate a new id when database reports a conflict', async function() {
        accountsDao.create.onCall(0).rejects({code: 'ER_DUP_ENTRY'});
        accountsDao.create.onCall(1).resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);

        sinon.assert.calledTwice(accountsDao.create);
        assert.notEqual(accountsDao.create.firstCall.args[1].id, accountsDao.create.secondCall.args[1].id);
    });

    it('should specify user id when creating account', async function() {
        accountsDao.create.resolves(null);
        const response = await makeRequest({name: 'Account 1', type: 'cc', balance: 40000});
        assert.equal(response.statusCode, 201);

        assert.equal(accountsDao.create.firstCall.args[0], userId);
    });

    function makeRequest(payload) {
        return new Promise((resolve, reject) => {
            server.inject(Object.assign({}, options, {
                payload: payload,
                credentials: {
                    userId
                },
            }), function(response) {
                resolve(response);
            });
        });
    }
});