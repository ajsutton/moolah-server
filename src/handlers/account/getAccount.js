const Boom = require('@hapi/boom');
const db = require('../../db/database');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const account = await daos.accounts.account(userId, request.params.id);
            if (account === undefined) {
                throw Boom.notFound('Account not found');
            } else {
                account.balance = await daos.transactions.balance(userId, {accountId: account.id});
                return account;
            }
        });
    },
};