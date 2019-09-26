const types = require('../types');
const db = require('../../db/database');
const Boom = require('@hapi/boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const transactionId = request.params.id;
            const transaction = await daos.transactions.transaction(userId, transactionId);
            if (transaction === undefined) {
                throw Boom.notFound('Transaction not found');
            } else {
                return transaction;
            }
        });
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        failAction: types.failAction,
    },
};