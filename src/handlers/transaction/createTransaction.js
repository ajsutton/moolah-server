const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const session = require('../../auth/session');
const validateTransaction = require('./validateTransaction');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const transactionData = request.payload;
            const validationError = await validateTransaction(transactionData, daos, userId);
            if (validationError === null) {
                while (true) {
                    try {
                        const transaction = Object.assign({id: idGenerator()}, request.payload);
                        await daos.transactions.create(userId, transaction);
                        return h.response(transaction).created(`/transactions/${encodeURIComponent(transaction.id)}/`);
                    } catch (error) {
                        if (error.code !== 'ER_DUP_ENTRY') {
                            throw error;
                        }
                    }
                }
            } else {
                throw validationError;
            }
        });
    },
    validate: {
        payload: Joi.object({
            type: types.transactionType.required(),
            date: types.date.required(),
            accountId: types.id,
            amount: types.money.required(),
            payee: types.payee,
            notes: types.notes,
            categoryId: types.id.allow(null),
            toAccountId: types.id.allow(null),
            earmark: types.id.allow(null),
            recurEvery: types.recurEvery.allow(null),
            recurPeriod: types.recurPeriod.allow(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction,
    },
};