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
            const results = await daos.transactions.incomeAndExpense(userId, request.query.monthEnd, request.query.after);
            reply({incomeAndExpense: results});
        },
    },
    validate: {
        query: {
            after: types.date.required(),
            monthEnd: types.monthEnd.required(),
        },
    },
};