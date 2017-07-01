const Joi = require('joi');
const types = require('../types');
const accountDao = require('../../db/accountDao');
const transactionDao = require('../../db/transactionDao');
const idGenerator = require('../../utils/idGenerator');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const transactionData = request.payload;
            const account = await accountDao.account(userId, transactionData.accountId);
            if (account === undefined) {
                reply(Boom.badRequest('Invalid account'));
            } else {
                while (true) {
                    try {
                        const transaction = Object.assign({id: idGenerator()}, request.payload);
                        await transactionDao.create(userId, transaction);
                        reply(transaction).code(201).header('Location', `/transactions/${encodeURIComponent(transaction.id)}/`);
                        return;
                    } catch (error) {
                        if (error.code !== 'ER_DUP_ENTRY') {
                            throw error;
                        }
                    }
                }
            }
        },
    },
    validate: {
        payload: Joi.object({
            type: types.transactionType.required(),
            date: types.date.required(),
            accountId: types.id.required(),
            amount: types.money.required(),
            payee: types.payee,
            notes: types.notes,
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};