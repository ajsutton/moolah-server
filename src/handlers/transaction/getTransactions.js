import types from '../types.js';
import transactionSearchOptions from '../transactionSearchOptions.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import Boom from '@hapi/boom';

export default {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const pageSize = request.query.pageSize;
            const offset = request.query.offset;

            let searchOptions;
            try {
                searchOptions = await transactionSearchOptions.parseOptions(request, daos);
            } catch (errorMessage) {
                throw Boom.notFound(errorMessage);
            }

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
            return {
                transactions: transactions.slice(0, pageSize),
                hasMore,
                priorBalance,
                totalNumberOfTransactions,
            };
        });
    },
    validate: {
        query: Object.assign(transactionSearchOptions.queryValidation, {
            pageSize: types.pageSize,
            offset: types.offset,
        }),
        failAction: types.failAction,
    },
};