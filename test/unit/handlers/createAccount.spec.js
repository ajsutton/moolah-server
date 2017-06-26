const serverFactory = require('../../../src/server');
const assert = require('chai').assert;
const sinon = require('sinon');
const accountsDao = require('../../../src/db/accountsDao');

describe('Create Account Handler', function() {
    const options = {
        url: '/accounts/',
        method: 'POST'
    };
    let server;

    beforeEach(async function() {
        sinon.stub(accountsDao, "create")
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

    function makeRequest(payload) {
        return new Promise((resolve, reject) => {
            server.inject(Object.assign({}, options, {payload: payload}), function(response) {
                resolve(response);
            });
        })
    }
});