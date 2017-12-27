const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const Boom = require('boom');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const accountId = request.query.account;
                const scheduled = request.query.scheduled;
                const pageSize = request.query.pageSize;
                const offset = request.query.offset;

                if (accountId !== undefined && await daos.accounts.account(userId, accountId) === undefined) {
                    reply(Boom.notFound('Account not found'));
                    return;
                }
                const searchOptions = {accountId, scheduled};
                if (pageSize !== undefined) {
                    searchOptions.pageSize = pageSize + 1;
                }
                if (offset !== undefined) {
                    searchOptions.offset = offset;
                }
                const transactions = await daos.transactions.transactions(userId, searchOptions);
                const hasMore = transactions.length > pageSize;
                const priorBalance = hasMore ? await daos.transactions.balance(userId, accountId, transactions[transactions.length - 1]) : 0;
                const totalNumberOfTransactions = await daos.transactions.transactionCount(userId, {accountId, scheduled});
                reply({
                    transactions: transactions.slice(0, pageSize),
                    hasMore,
                    priorBalance,
                    totalNumberOfTransactions,
                });
            });
        },
    },
    validate: {
        query: {
            account: types.id.default(undefined),
            scheduled: types.boolean.default(false),
            pageSize: types.pageSize,
            offset: types.offset,
        },
    },
};