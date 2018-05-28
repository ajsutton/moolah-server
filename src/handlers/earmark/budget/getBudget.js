const Boom = require('boom');
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
                return {amount: await daos.budget.getBudget(userId, earmark.id, category.id)};
            }
        });
    },
}