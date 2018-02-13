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
                const account = await daos.accounts.account(userId, request.params.id);
                if (account === undefined) {
                    reply(Boom.notFound('Account not found'));
                } else {
                    const modifiedAccount = Object.assign(account, request.payload);
                    modifiedAccount.balance = await daos.transactions.balance(userId, {accountId: account.id});
                    await daos.accounts.store(userId, modifiedAccount);
                    reply(modifiedAccount);
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
            type: types.accountType.required(),
            position: types.position,
            balance: types.money,
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};