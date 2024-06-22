import Boom from '@hapi/boom';
import db from '../../../db/database.js';
import session from '../../../auth/session.js';
import Joi from 'joi';
import types from '../../types.js';


export default {

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