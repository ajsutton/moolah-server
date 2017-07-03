const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const accountDao = require('../../db/accountDao');
const transactionDao = require('../../db/transactionDao');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const account = await accountDao.account(userId, request.params.id);
            if (account === undefined) {
                reply(Boom.notFound('Account not found'));
            } else {
                const modifiedAccount = Object.assign(account, request.payload);
                await db.withTransaction(async tx => {
                    await accountDao.store(userId, modifiedAccount, tx);
                    const openingBalance = await transactionDao.transaction(userId, account.id);
                    openingBalance.amount = modifiedAccount.balance;
                    await transactionDao.store(userId, openingBalance, tx);
                });
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
            position: types.position,
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};