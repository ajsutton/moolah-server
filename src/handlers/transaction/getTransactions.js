const types = require('../types');
const transactionDao = require('../../db/transactionDao');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const accountId = request.query.account;
            const transactions = await transactionDao.transactions(userId, accountId);
            reply(transactions);
        },
    },
    validate: {
        query: {
            account: types.id.required(),
        },
    },
};