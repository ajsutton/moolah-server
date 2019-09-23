const assert = require('chai').assert;
const serverFactory = require('../../../../src/server');
const idGenerator = require('../../../../src/utils/idGenerator');
const dbTestUtils = require('../../../utils/dbTestUtils');

describe('Get Accounts Handler', function() {
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

    it('should reply with accounts', async function() {
        const accounts = [{id: '1', name: 'Account 1'}, {id: 2, name: 'Account 2'}];
        daos.accounts.accounts.withArgs(userId).returns(accounts);
        const response = await makeRequest();
        assert.deepEqual(response.payload, JSON.stringify({accounts: accounts}));
    });


    function makeRequest() {
        return server.inject({
            url: `/api/accounts/`,
            method: 'GET',
            auth: {
                strategy: 'cookie',
                credentials: {
                    userId,
                },
            },
        });
    }
});