const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const Boom = require('boom');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const daos = db.daos(request);
            const transactionData = request.payload;
            const account = await daos.accounts.account(userId, transactionData.accountId);
            if (account === undefined) {
                reply(Boom.badRequest('Invalid accountId'));
            } else if (transactionData.toAccountId !== undefined && transactionData.toAccountId !== null && await daos.accounts.account(userId, transactionData.toAccountId) === undefined) {
                reply(Boom.badRequest('Invalid toAccountId'));
            } else if (transactionData.recurEvery !== undefined && transactionData.recurPeriod === undefined) {
                reply(Boom.badRequest('recurEvery is only applicable when recurPeriod is set'));
            } else {
                while (true) {
                    try {
                        const transaction = Object.assign({id: idGenerator()}, request.payload);
                        await daos.transactions.create(userId, transaction);
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
            categoryId: types.id.allow(null),
            toAccountId: types.id.allow(null),
            recurEvery: types.recurEvery.allow(null),
            recurPeriod: types.recurPeriod.allow(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};