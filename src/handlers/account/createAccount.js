const Joi = require('joi');
const types = require('../types');
const accountsDao = require('../../db/accountsDao');
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
                    await accountsDao.create(userId, account);
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
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};