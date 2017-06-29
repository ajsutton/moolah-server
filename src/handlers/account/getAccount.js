const Boom = require('boom');
const accountsDao = require('../../db/accountsDao');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const account = await accountsDao.account(session.getUserId(request), request.params.id);
            if (account === undefined) {
                reply(Boom.notFound('Account not found'));
            } else {
                reply(account);
            }
        },
    },
};