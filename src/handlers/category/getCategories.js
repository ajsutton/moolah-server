import db from '../../db/database.js';
import session from '../../auth/session.js';

export default {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const categories = await daos.categories.categories(userId);
            return {categories};
        });
    },
};