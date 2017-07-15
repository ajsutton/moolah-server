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
            const daos = db.daos(request);
            const transaction = await daos.transactions.transaction(userId, request.params.id);
            if (transaction === undefined) {
                reply(Boom.notFound('Transaction not found'));
            } else {
                const modifiedTransaction = Object.assign(transaction, request.payload);
                await daos.transactions.store(userId, modifiedTransaction);
                reply(modifiedTransaction);
            }
        },
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        payload: Joi.object({
            id: types.id,
            type: types.transactionType.required(),
            date: types.date.required(),
            accountId: types.id.required(),
            amount: types.money.required(),
            balance: types.money.default(null),
            payee: types.payee.default(null),
            notes: types.notes.default(null),
            categoryId: types.id.default(null),
            toAccountId: types.id.allow(null).default(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};