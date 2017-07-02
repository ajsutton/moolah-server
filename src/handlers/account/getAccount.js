const Boom = require('boom');
const accountDao = require('../../db/accountDao');
const transactionDao = require('../../db/transactionDao');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const account = await accountDao.account(userId, request.params.id);
            account.balance = await transactionDao.balance(userId, account.id);
            if (account === undefined) {
                reply(Boom.notFound('Account not found'));
            } else {
                reply(account);
            }
        },
    },
};