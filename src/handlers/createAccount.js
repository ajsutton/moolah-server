const Joi = require('joi');
const types = require('./types');
const accountsDao = require('../db/accountsDao');
const Boom = require('boom');

module.exports = {
    handler: {
        async: async function(request, reply) {
            try {
                const account = request.payload;
                await accountsDao.create(account);
                reply(account).code(201).header('Location', `/accounts/${encodeURIComponent(account.id)}/`);
            } catch (error) {
                console.error(JSON.stringify(error));
                if (error.code === 'ER_DUP_ENTRY') {
                    reply(Boom.conflict('`id` is already in use'));
                } else {
                    throw error;
                }
            }
        },
    },
    validate: {
        payload: Joi.object({
            id: types.id.required(),
            name: types.name.required(),
            type: types.accountType.required(),
            balance: types.money.required(),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};