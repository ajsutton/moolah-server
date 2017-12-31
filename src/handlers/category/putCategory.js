const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('boom');
const session = require('../../auth/session');

async function getParentIdRejectionReason(userId, daos, categoryId, parentId) {
    while (parentId !== null && parentId !== undefined) {
        const parentCategory = await daos.categories.category(userId, parentId);
        if (parentCategory === undefined) {
            return Boom.badRequest('Unknown parent category');
        } else if (parentCategory.id === categoryId) {
            return Boom.badRequest('Category can not be its own ancestor');
        }
        parentId = parentCategory.parentId;
    }
    return undefined;
}

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const currentCategory = await daos.categories.category(userId, request.params.id);
                if (currentCategory === undefined) {
                    reply(Boom.notFound('Category not found'));
                } else {
                    const parentIdRejectionReason = await getParentIdRejectionReason(userId, daos, request.params.id, request.payload.parentId);
                    if (parentIdRejectionReason !== undefined) {
                        reply(parentIdRejectionReason);
                    } else {
                        const modifiedCategory = Object.assign({}, currentCategory, request.payload);
                        await daos.categories.store(userId, modifiedCategory);
                        reply(modifiedCategory);
                    }
                }
            });
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