const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('boom');
const session = require('../../auth/session');
const validateTransaction = require('./validateTransaction');


module.exports = {
    auth: 'session',
    handler: async function(request, reply) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const transaction = await daos.transactions.transaction(userId, request.params.id);
            if (transaction === undefined) {
                reply(Boom.notFound('Transaction not found'));
                return;
            }
            const modifiedTransaction = Object.assign(transaction, request.payload);
            const validationError = await validateTransaction(modifiedTransaction, daos, userId);
            if (validationError === null) {
                await daos.transactions.store(userId, modifiedTransaction);
                return modifiedTransaction;
            } else {
                throw validationError;
            }
        });
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        payload: Joi.object({
            id: types.id,
            type: types.transactionType.required(),
            date: types.date.required(),
            accountId: types.id,
            amount: types.money.required(),
            balance: types.money.default(null),
            payee: types.payee.default(null),
            notes: types.notes.default(null),
            categoryId: types.id.allow(null).default(null),
            toAccountId: types.id.allow(null).default(null),
            earmark: types.id.allow(null).default(null),
            recurEvery: types.recurEvery.allow(null),
            recurPeriod: types.recurPeriod.allow(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction,
    },
};