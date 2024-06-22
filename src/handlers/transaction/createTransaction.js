import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import idGenerator from '../../utils/idGenerator.js';
import session from '../../auth/session.js';
import validateTransaction from './validateTransaction.js';

export default {
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