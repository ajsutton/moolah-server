const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('@hapi/boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const account = await daos.accounts.account(userId, request.params.id);
            if (account === undefined) {
                throw Boom.notFound('Account not found');
            }
            await daos.investmentValue.removeValue(userId, account.id, request.params.date)
            return null;
        });
    },
    validate: {
        params: {
            id: types.id.required(),
            date: types.date.required(),
        },
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction
    },
};