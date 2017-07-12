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
            const pageSize = request.query.pageSize;
            const offset = request.query.offset;
            if (await daos.accounts.account(userId, accountId) === undefined) {
                reply(Boom.notFound('Account not found'));
                return;
            }
            const transactions = await daos.transactions.transactions(userId, accountId, pageSize !== undefined ? pageSize + 1 : undefined, offset);
            const hasMore = transactions.length > pageSize;
            const priorBalance = hasMore ? await daos.transactions.balance(userId, accountId, transactions[transactions.length - 1]) : 0;
            reply({
                transactions: transactions.slice(0, pageSize),
                hasMore,
                priorBalance,
            });
        },
    },
    validate: {
        query: {
            account: types.id.required(),
            pageSize: types.pageSize,
            offset: types.offset,
        },
    },
};