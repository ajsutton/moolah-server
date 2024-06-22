import { assert } from 'chai';
import {create as serverFactory} from '../../../../src/server.js';
import idGenerator from '../../../../src/utils/idGenerator.js';
import dbTestUtils from '../../../utils/dbTestUtils.js';

describe('Get Accounts Handler', function() {
    let server;
    let userId;
    let daos;

    beforeEach(async function() {
        userId = idGenerator();
        daos = dbTestUtils.stubDaos();
        server = await serverFactory();
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