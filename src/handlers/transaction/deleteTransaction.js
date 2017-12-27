const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const transactionId = request.params.id;
                const transaction = await daos.transactions.transaction(userId, transactionId);
                if (transaction === undefined) {
                    reply(Boom.notFound('Transaction not found'));
                } else {
                    await daos.transactions.delete(userId, transactionId);
                    reply().code(204);
                }
            });
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};