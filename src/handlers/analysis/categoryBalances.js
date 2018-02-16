const db = require('../../db/database');
const session = require('../../auth/session');
const transactionSearchOptions = require('../transactionSearchOptions');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                try {
                    const searchOptions = await transactionSearchOptions.parseOptions(request, daos);
                    const balances = await daos.transactions.balanceByCategory(userId, searchOptions);
                    reply(balances);
                } catch (errorMessage) {
                    reply(Boom.notFound(errorMessage));
                }
            });
        },
    },
    validate: {
        query: transactionSearchOptions.queryValidation,
    },
};