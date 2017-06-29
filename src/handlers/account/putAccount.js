const Joi = require('joi');
const types = require('../types');
const accountsDao = require('../../db/accountsDao');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const account = await accountsDao.account(userId, request.params.id);
            if (account === undefined) {
                reply(Boom.notFound('Account not found'));
            } else {
                const modifiedAccount = Object.assign(account, request.payload);
                accountsDao.store(userId, modifiedAccount);
                reply(modifiedAccount);
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
            type: types.accountType.required(),
            balance: types.money.required(),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};