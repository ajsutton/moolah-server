const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const Joi = require('joi');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const results = await daos.analysis.incomeAndExpense(userId, request.query.monthEnd, request.query.after);
            return {incomeAndExpense: results};
        });
    },
    validate: {
        query: Joi.object({
            after: types.date.default(null),
            monthEnd: types.monthEnd.required(),
        }),
        failAction: types.failAction,
    },
};