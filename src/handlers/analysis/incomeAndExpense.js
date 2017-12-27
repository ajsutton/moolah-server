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
            await db.withTransaction(request, async daos => {
                const results = await daos.analysis.incomeAndExpense(userId, request.query.monthEnd, request.query.after);
                reply({incomeAndExpense: results});
            });
        },
    },
    validate: {
        query: {
            after: types.date.default(null),
            monthEnd: types.monthEnd.required(),
        },
    },
};