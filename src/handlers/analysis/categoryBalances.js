const db = require('../../db/database');
const session = require('../../auth/session');
const transactionSearchOptions = require('../transactionSearchOptions');
const Boom = require('boom');
const types = require('../types');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            try {
                const searchOptions = await transactionSearchOptions.parseOptions(request, daos);
                return await daos.transactions.balanceByCategory(userId, searchOptions);
            } catch (errorMessage) {
                throw Boom.notFound(errorMessage);
            }
        });
    },
    validate: {
        query: transactionSearchOptions.queryValidation,
        failAction: types.failAction
    },
};