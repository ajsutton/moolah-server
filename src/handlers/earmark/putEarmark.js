import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import Boom from '@hapi/boom';
import session from '../../auth/session.js';
import loadEarmarkBalance from './loadEarmarkBalance.js';

export default {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const earmark = await daos.earmarks.earmark(userId, request.params.id);
            if (earmark === undefined) {
                throw Boom.notFound('Earmark not found');
            } else {
                const modifiedEarmark = Object.assign(earmark, request.payload);
                await daos.earmarks.store(userId, modifiedEarmark);
                await loadEarmarkBalance(userId, modifiedEarmark, daos);
                return modifiedEarmark;
            }
        });
    },
    validate: {
        params: {
            id: types.id.required(),
        },
        payload: Joi.object({
            id: types.id,
            name: types.name.required(),
            position: types.position,
            hidden: types.boolean,
            balance: types.money,
            saved: types.money,
            spent: types.money,
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