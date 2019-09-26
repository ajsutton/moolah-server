const Boom = require('@hapi/boom');
const db = require('../../db/database');
const session = require('../../auth/session');

module.exports = {
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