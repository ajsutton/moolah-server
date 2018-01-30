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
                const from = request.query.from;
                const to = request.query.to;
                const categories = request.query.category;
                const pageSize = request.query.pageSize;
                const offset = request.query.offset;

                if (accountId !== undefined && await daos.accounts.account(userId, accountId) === undefined) {
                    reply(Boom.notFound('Account not found'));
                    return;
                }
                const loadedCategories = await Promise.all(categories
                    .map(async categoryId => ({
                        id: categoryId,
                        category: await daos.categories.category(userId, categoryId)
                    })));
                const missingCategories = loadedCategories.filter(data => data.category === undefined);
                if (missingCategories.length > 0) {
                    reply(Boom.notFound('Unknown category ' + missingCategories.map(data => data.id).join(', ')));
                    return;
                }
                const searchOptions = {accountId, scheduled, from, to, categories};
                const searchOptionsWithPaging = Object.assign({}, searchOptions);
                if (pageSize !== undefined) {
                    searchOptionsWithPaging.pageSize = pageSize + 1;
                }
                if (offset !== undefined) {
                    searchOptionsWithPaging.offset = offset;
                }
                const transactions = await daos.transactions.transactions(userId, searchOptionsWithPaging);
                const hasMore = transactions.length > pageSize;
                const priorBalance = hasMore ? await daos.transactions.balance(userId, searchOptions, transactions[transactions.length - 1]) : 0;
                const totalNumberOfTransactions = await daos.transactions.transactionCount(userId, searchOptions);
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
            from: types.date.default(undefined),
            to: types.date.default(undefined),
            category: types.arrayOf(types.id).default([]),
            scheduled: types.boolean.default(false),
            pageSize: types.pageSize,
            offset: types.offset,
        },
    },
};