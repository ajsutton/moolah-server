const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const session = require('../../auth/session');
const Boom = require('boom');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            while (true) {
                try {
                    const category = Object.assign({id: idGenerator()}, request.payload);
                    const userId = session.getUserId(request);
                    const daos = db.daos(request);
                    if (category.parentId !== undefined && await daos.categories.category(userId, category.parentId) === undefined) {
                        reply(Boom.badRequest('Unknown parent category', category.parentId));
                        return;
                    }
                    await daos.categories.create(userId, category);
                    reply(category).code(201).header('Location', `/categories/${encodeURIComponent(category.id)}/`);
                    return;
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY') {
                        throw error;
                    }
                }
            }
        },
    },
    validate: {
        payload: Joi.object({
            name: types.name.required(),
            parentId: types.id,
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};