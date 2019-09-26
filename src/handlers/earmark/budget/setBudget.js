const Boom = require('@hapi/boom');
const db = require('../../../db/database');
const session = require('../../../auth/session');
const Joi = require('joi');
const types = require('../../types');


module.exports = {

    auth: 'session',
    handler: async function(request, h) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const earmark = await daos.earmarks.earmark(userId, request.params.earmarkId);
            if (earmark === undefined) {
                throw Boom.notFound('Earmark not found');
            } else {
                const category = await daos.categories.category(userId, request.params.categoryId);
                if (category === undefined) {
                    throw Boom.notFound('Category not found');
                }
                await daos.budget.setBudget(userId, earmark.id, category.id, request.payload.amount);
                return  h.response({amount: request.payload.amount}).created();
            }
        });
    },

    validate: {
        payload: Joi.object({
            amount: types.money.required(),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction,
    },
}