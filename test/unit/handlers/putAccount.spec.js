const proxyquire = require('proxyquire');
const sinon = require('sinon');
const Boom = require('boom');

let accounts = [];

const mockDao = {
    account: sinon.stub(),
    store: sinon.spy(),
};
const putAccount = proxyquire('../../../src/handlers/account/putAccount', {
    '../../db/accountsDao': mockDao,
}).handler.async;

describe('Put Account Handler', function() {
    let reply;

    beforeEach(function() {
        reply = sinon.spy();
    });

    it('should return 404 when account does not exist', async function() {
        const request = {
            params: {id: 123},
        };
        await putAccount(request, reply);
        sinon.assert.calledOnce(reply);
        sinon.assert.calledWithMatch(reply, {isBoom: true, output: Boom.notFound('Account not found').output});
    });

    it('should update existing account', async function() {
        const request = {
            params: {id: 123},
            payload: {name: 'Updated account', type: 'cc', balance: 20000},
        };
        const modifiedAccount = {id: 123, name: 'Updated account', type: 'cc', balance: 20000};
        mockDao.account = mockDao.account.withArgs(123).returns({id: 123, name: 'Original account', type: 'bank', balance: 45000});
        await putAccount(request, reply);
        sinon.assert.calledOnce(mockDao.store);
        sinon.assert.calledWith(mockDao.store, modifiedAccount);
        sinon.assert.calledOnce(reply);
        sinon.assert.calledWithMatch(reply, modifiedAccount);
    });
});