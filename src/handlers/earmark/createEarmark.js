const Joi = require('joi');
const types = require('../types');
const db = require('../../db/database');
const idGenerator = require('../../utils/idGenerator');
const session = require('../../auth/session');
const loadEarmarkBalance = require('./loadEarmarkBalance');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
            while (true) {
                try {
                    const earmark = Object.assign({id: idGenerator()}, request.payload, {hidden: false});
                    const userId = session.getUserId(request);
                    await db.withTransaction(request, async daos => {
                        await daos.earmarks.create(userId,
                            {
                                id: earmark.id,
                                name: earmark.name,
                                savingsTarget: earmark.savingsTarget,
                                savingsStartDate: earmark.savingsStartDate,
                                savingsEndDate: earmark.savingsEndDate,
                            });
                        await loadEarmarkBalance(userId, earmark, daos);
                    });
                    delete earmark.date;
                    return h.response(earmark).created(`/earmarks/${encodeURIComponent(earmark.id)}/`);
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY') {
                        throw error;
                    }
                }
            }
    },
    validate: {
        payload: Joi.object({
            name: types.name.required(),
            balance: types.money,
            saved: types.money,
            spent: types.money,
            position: types.position,
            date: types.date.default(null),
            savingsTarget: types.money.allow(null).default(() => undefined),
            savingsStartDate: types.date.default(() => undefined),
            savingsEndDate: types.date.default(() => undefined),
        }),
        headers: Joi.object({
            'Content-Type': types.jsonContentType,
        }).unknown(true),
        failAction: types.failAction,
    },
};