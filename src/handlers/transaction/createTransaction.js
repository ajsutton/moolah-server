const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const Boom = require('boom');
const session = require('../../auth/session');
const validateTransaction = require('./validateTransaction');

async function isInvalidToAccountId(daos, userId, accountId) {
    const toAccount = await daos.accounts.account(userId, accountId);
    return toAccount === undefined || toAccount.type === 'earmark';
}

async function isInvalidEarmarkId(daos, userId, earmarkId) {
    const toAccount = await daos.earmarks.earmark(userId, earmarkId);
    return toAccount === undefined;
}

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const transaction = await db.withTransaction(request, async daos => {
                const transactionData = request.payload;
                const validationError = await validateTransaction(transactionData, daos, userId);
                if (validationError === null) {
                    while (true) {
                        try {
                            const transaction = Object.assign({id: idGenerator()}, request.payload);
                            await daos.transactions.create(userId, transaction);
                            return transaction;
                        } catch (error) {
                            if (error.code !== 'ER_DUP_ENTRY') {
                                throw error;
                            }
                        }
                    }
                } else {
                    reply(validationError);
                }
            });
            if (transaction !== undefined) {
                reply(transaction).code(201).header('Location', `/transactions/${encodeURIComponent(transaction.id)}/`);
            }
        },
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
    },
};