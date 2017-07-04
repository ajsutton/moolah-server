const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const Boom = require('boom');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const daos = db.daos(request);
            const accountId = request.query.account;
            if (await daos.accounts.account(userId, accountId) === undefined) {
                reply(Boom.notFound('Account not found'));
            }
            const transactions = await daos.transactions.transactions(userId, accountId);
            reply(transactions);
        },
    },
    validate: {
        query: {
            account: types.id.required(),
        },
    },
};