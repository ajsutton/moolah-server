const types = require('../types');
const transactionDao = require('../../db/transactionDao');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const transactionId = request.params.id;
            const transaction = await transactionDao.get(userId, transactionId);
            if (transaction === undefined) {
                reply(Boom.notFound('Transaction not found'));
            } else {
                reply(transaction);
            }
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
    },
};