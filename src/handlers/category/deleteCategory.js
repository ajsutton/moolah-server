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
                    const replacementCategoryId = request.query.replaceWith === undefined ? null : request.query.replaceWith;
                    if (replacementCategoryId !== null) {
                        const replacementCategory = await daos.categories.category(userId, replacementCategoryId);
                        if (replacementCategory === undefined) {
                            reply(Boom.badRequest('Replacement category not found'));
                        }
                    }
                    daos.transactions.removeCategory(userId, categoryId, replacementCategoryId);
                    reply().code(204);
                }
            });
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        query: {
            replaceWith: types.id,
        },
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};