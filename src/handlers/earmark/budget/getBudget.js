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
                return {amount: await daos.budget.getBudget(userId, earmark.id, category.id)};
            }
        });
    },
}