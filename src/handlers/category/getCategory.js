import Boom from '@hapi/boom';
import db from '../../db/database.js';
import session from '../../auth/session.js';

export default {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const category = await daos.categories.category(userId, request.params.id);
            if (category === undefined) {
                throw Boom.notFound('Category not found');
            } else {
                return category;
            }
        });
    },
};