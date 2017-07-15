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
            const daos = db.daos(request);
            const currentCategory = await daos.categories.category(userId, request.params.id);
            if (currentCategory === undefined) {
                reply(Boom.notFound('Category not found'));
            } else if (request.payload.parentId !== undefined && request.payload.parentId !== null && await daos.categories.category(userId, request.payload.parentId) === undefined) {
                reply(Boom.badRequest('Unknown parent category', request.payload.parentId));
            } else {
                const modifiedCategory = Object.assign({}, currentCategory, request.payload);
                await daos.categories.store(userId, modifiedCategory);
                reply(modifiedCategory);
            }
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        payload: Joi.object({
            id: types.id,
            name: types.name.required(),
            parentId: types.id.allow(null).default(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};