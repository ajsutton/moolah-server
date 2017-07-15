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
                const categoryId = request.params.id;
                const currentCategory = await daos.categories.category(userId, categoryId);
                if (currentCategory === undefined) {
                    reply(Boom.notFound('Category not found'));
                } else {
                    daos.categories.remove(userId, categoryId);
                    daos.transactions.removeCategory(userId, categoryId);
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