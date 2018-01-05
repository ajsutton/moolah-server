const Boom = require('boom')
const db = require('../../db/database');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const account = await daos.accounts.account(userId, request.params.id);
                account.balance = await daos.transactions.balance(userId, {accountId: account.id});
                if (account === undefined) {
                    reply(Boom.notFound('Account not found'));
                } else {
                    reply(account);
                }
            });
        },
    },
};