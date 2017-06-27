const Joi = require('joi');
const types = require('../types');
const accountsDao = require('../../db/accountsDao');
const idGenerator = require('../../utils/idGenerator');

module.exports = {
    handler: {
        async: async function(request, reply) {
            while (true) {
                try {
                    const account = Object.assign({id: idGenerator()}, request.payload);
                    await accountsDao.create(account);
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