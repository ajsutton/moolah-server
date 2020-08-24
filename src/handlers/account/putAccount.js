const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('@hapi/boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const account = await daos.accounts.account(userId, request.params.id);
            if (account === undefined) {
                throw Boom.notFound('Account not found');
            } else {
                const modifiedAccount = Object.assign(account, request.payload);
                modifiedAccount.balance = await daos.transactions.balance(userId, {accountId: account.id});
                await daos.accounts.store(userId, modifiedAccount);
                return modifiedAccount;
            }
        });
    },
    validate: {
        params: Joi.object({
            id: types.id.required(),
        }),
        payload: Joi.object({
            id: types.id,
            name: types.name.required(),
            type: types.accountType.required(),
            position: types.position,
            balance: types.money,
            hidden: types.boolean,
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction
    },
};