// const proxyquire = require('proxyquire').noPreserveCache();
// const sinon = require('sinon');
//
// let accounts = [];
//
// const getAccounts = proxyquire('../../../src/handlers/account/getAccounts', {
//     '../../db/accountsDao': {
//         async accounts() {
//             return accounts;
//         }
//     }
// }).handler.async;
//
// describe('Get Accounts Handler', function() {
//     let request;
//     let reply;
//
//     beforeEach(function() {
//         request = sinon.spy();
//         reply = sinon.spy();
//     });
//
//     it('should reply with accounts', async function() {
//         accounts = [{id: "1", name: 'Account 1'}, {id: 2, name: 'Account 2'}];
//         await getAccounts(request, reply);
//
//         sinon.assert.calledOnce(reply);
//         sinon.assert.calledWith(reply, {accounts: accounts});
//     });
// });