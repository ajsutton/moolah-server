const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            while (true) {
                try {
                    const account = Object.assign({id: idGenerator()}, request.payload);
                    const userId = session.getUserId(request);
                    await db.withTransaction(request, async daos => {
                        await daos.accounts.create(userId,
                            {
                                id: account.id,
                                name: account.name,
                                type: account.type,
                            });
                        await daos.transactions.create(userId,
                            {
                                id: account.id,
                                accountId: account.id,
                                type: 'openingBalance',
                                date: account.date !== null ? account.date : new Date(),
                                amount: account.balance,
                            });
                    });
                    delete account.date;
                    reply(account).code(201).header('Location', `/accounts/${encodeURIComponent(account.id)}/`);
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
            type: types.accountType.required(),
            balance: types.money.required(),
            position: types.position,
            date: types.date.default(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};