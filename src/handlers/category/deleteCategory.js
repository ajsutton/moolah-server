const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('@hapi/boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const categoryId = request.params.id;
            const currentCategory = await daos.categories.category(userId, categoryId);
            if (currentCategory === undefined) {
                throw Boom.notFound('Category not found');
            } else {
                daos.categories.remove(userId, categoryId);
                const replacementCategoryId = request.query.replaceWith === undefined ? null : request.query.replaceWith;
                if (replacementCategoryId !== null) {
                    const replacementCategory = await daos.categories.category(userId, replacementCategoryId);
                    if (replacementCategory === undefined) {
                        throw Boom.badRequest('Replacement category not found');
                    }
                }
                await daos.transactions.removeCategory(userId, categoryId, replacementCategoryId);
                await daos.budget.removeCategory(userId, categoryId, replacementCategoryId);
                return h.response().code(204);
            }
        });
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
        failAction: types.failAction,
    },
};