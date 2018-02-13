const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const Boom = require('boom');
const session = require('../../auth/session');

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
                const hasAccount = transactionData.accountId !== undefined;
                if (hasAccount && (await daos.accounts.account(userId, transactionData.accountId)) === undefined) {
                    reply(Boom.badRequest('Invalid accountId'));
                } else if (!hasAccount && transactionData.type !== 'income') {
                    reply(Boom.badRequest('Earmarking funds must use income'));
                } else if (!hasAccount && (transactionData.earmark === null || transactionData.earmark === undefined)) {
                    reply(Boom.badRequest('accountId or earmark required'));
                } else if (transactionData.toAccountId !== undefined && transactionData.toAccountId !== null && await isInvalidToAccountId(daos, userId, transactionData.toAccountId)) {
                    reply(Boom.badRequest('Invalid toAccountId'));
                } else if (transactionData.recurEvery !== undefined && transactionData.recurPeriod === undefined) {
                    reply(Boom.badRequest('recurEvery is only applicable when recurPeriod is set'));
                } else if (hasAccount && transactionData.toAccountId === transactionData.accountId) {
                    reply(Boom.badRequest('Cannot transfer to own account'));
                } else if (transactionData.type === 'transfer' && (transactionData.toAccountId === undefined || transactionData.toAccountId === null)) {
                    reply(Boom.badRequest('toAccountId is required when type is transfer'));
                } else if (transactionData.type !== 'transfer' && (transactionData.toAccountId !== undefined && transactionData.toAccountId !== null)) {
                    reply(Boom.badRequest('toAccountId invalid when type is not transfer'));
                } else if (transactionData.earmark !== null && transactionData.earmark !== undefined && await isInvalidEarmarkId(daos, userId, transactionData.earmark)) {
                    reply(Boom.badRequest('Invalid earmark'));
                } else {
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