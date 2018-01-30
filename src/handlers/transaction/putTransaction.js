const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const Boom = require('boom');
const session = require('../../auth/session');

async function isInvalidToAccountId(transactionData, daos, userId) {
    const toAccount = await daos.accounts.account(userId, transactionData.toAccountId);
    return toAccount === undefined || toAccount.type === 'earmark';
}

async function isInvalidEarmarktId(daos, userId, accountId) {
    const toAccount = await daos.accounts.account(userId, accountId);
    return toAccount === undefined || toAccount.type !== 'earmark';
}

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const transaction = await daos.transactions.transaction(userId, request.params.id);
                if (transaction === undefined) {
                    reply(Boom.notFound('Transaction not found'));
                    return;
                }
                const modifiedTransaction = Object.assign(transaction, request.payload);
                const account = await daos.accounts.account(userId, modifiedTransaction.accountId);
                if (account === undefined) {
                    reply(Boom.badRequest('Invalid accountId'));
                    return;
                }
                if (modifiedTransaction.toAccountId !== undefined && modifiedTransaction.toAccountId !== null && await isInvalidToAccountId(modifiedTransaction, daos, userId)) {
                    reply(Boom.badRequest('Invalid toAccountId'));
                    return;
                }
                if (modifiedTransaction.recurEvery !== undefined && modifiedTransaction.recurPeriod === undefined) {
                    reply(Boom.badRequest('recurEvery is only applicable when recurPeriod is set'));
                    return;
                }
                if (modifiedTransaction.accountId == modifiedTransaction.toAccountId) {
                    reply(Boom.badRequest('Cannot transfer to own account'));
                    return;
                }
                if (modifiedTransaction.type !== 'income' && account.type === 'earmark') {
                    reply(Boom.badRequest('Only income transactions are allowed for earmark accounts'));
                    return;
                }
                if (modifiedTransaction.type === 'transfer' && (modifiedTransaction.toAccountId === undefined || modifiedTransaction.toAccountId === null)) {
                    reply(Boom.badRequest('toAccountId is required when type is transfer'));
                    return;
                }
                if (modifiedTransaction.type !== 'transfer' && (modifiedTransaction.toAccountId !== undefined && modifiedTransaction.toAccountId !== null)) {
                    reply(Boom.badRequest('toAccountId invalid when type is not transfer'));
                    return;
                }
                if (modifiedTransaction.earmark !== undefined && modifiedTransaction.earmark !== null && await isInvalidEarmarktId(daos, userId, modifiedTransaction.earmark))
                {
                    reply(Boom.badRequest('Invalid earmark'));
                    return;
                }
                await daos.transactions.store(userId, modifiedTransaction);
                reply(modifiedTransaction);
            });
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
            categoryId: types.id.allow(null).default(null),
            toAccountId: types.id.allow(null).default(null),
            earmark: types.id.allow(null).default(null),
            recurEvery: types.recurEvery.allow(null),
            recurPeriod: types.recurPeriod.allow(null),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
    },
};