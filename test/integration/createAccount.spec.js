const serverFactory = require('../../src/server');
const assert = require('chai').assert;

describe('Create Account Handler', function() {
    const options = {
        url: '/accounts/',
        method: 'POST'
    };
    let server;

    beforeEach(async function() {
        server = await serverFactory.create();
    });

    afterEach(function() {
        return server.stop();
    });

    it('should create an account with a unique id', async function() {
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