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
            await db.withTransaction(request, async daos => {
                const earmark = await daos.earmarks.earmark(userId, request.params.id);
                if (earmark === undefined) {
                    reply(Boom.notFound('Earmark not found'));
                } else {
                    const modifiedEarmark = Object.assign(earmark, request.payload);
                    await daos.earmarks.store(userId, modifiedEarmark);
                    reply(modifiedEarmark);
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
            position: types.position,
            balance: types.money,
            savingsTarget: types.money.allow(null).default(undefined),
            savingsStartDate: types.date.default(undefined),
            savingsEndDate: types.date.default(undefined),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};