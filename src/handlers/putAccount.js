const Joi = require('joi');
const types = require('./types');
const accountsDao = require('../db/accountsDao');
const Boom = require('boom');

module.exports = {
    handler: {
        async: async function(request, reply) {
            const account = await accountsDao.account(request.params.id);
            if (account === undefined) {
                reply(Boom.notFound('Account not found'));
            } else {
                const modifiedAccount = Object.assign(account, request.payload);
                accountsDao.store(modifiedAccount);
                reply(modifiedAccount);
            }
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        payload: Joi.object({
            name: types.name.required(),
            type: types.accountType.required(),
            balance: types.money.required(),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};