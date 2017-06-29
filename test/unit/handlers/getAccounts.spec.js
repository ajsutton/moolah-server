const sinon = require('sinon');
const assert = require('chai').assert;
const serverFactory = require('../../../src/server');
const accountsDao = require('../../../src/db/accountsDao');
const idGenerator = require('../../../src/utils/idGenerator');

const getAccounts = require('../../../src/handlers/account/getAccounts').handler.async;

describe('Get Accounts Handler', function() {
    let server;
    let userId;

    beforeEach(async function() {
        userId = idGenerator();
        sinon.stub(accountsDao, 'accounts');
        server = await serverFactory.create();
    });

    afterEach(function() {
        accountsDao.accounts.restore();
        return server.stop();
    });

    it('should reply with accounts', async function() {
        const accounts = [{id: "1", name: 'Account 1'}, {id: 2, name: 'Account 2'}];
        accountsDao.accounts.withArgs(userId).returns(accounts);
        const response = await makeRequest();
        assert.deepEqual(response.payload, JSON.stringify({accounts: accounts}));
    });


    function makeRequest() {
        return new Promise((resolve, reject) => {
            server.inject({
                    url: `/accounts/`,
                    method: 'GET',
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