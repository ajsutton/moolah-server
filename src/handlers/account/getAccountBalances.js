import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import { addDays, format as formatDate, parseISO } from 'date-fns';

export default {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        const accountId = request.params.id;
        return await db.withTransaction(request, async daos => {
            const after = request.query.after ? parseISO(request.query.after) : null;
            let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, {accountId}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            const results = await daos.transactions.dailyBalanceChange(userId,{accountId, after: after ? formatDate(after, 'yyyy-MM-dd') : null});
            return results.map(dailyProfit => {
                currentBalance += dailyProfit.profit;
                return {date: dailyProfit.date, balance: currentBalance};
            });
        });
    },
    validate: {
        query: {
            after: types.date.default(null),
        },
        failAction: types.failAction,
    },
};