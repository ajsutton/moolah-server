import session from '../../auth/session.js';
import db from '../../db/database.js';

export default {
    auth: 'session',
    handler: async function(request, h) {
        try {
            const userId = session.getUserId(request);
            return await db.withTransaction(request, async daos => {
                const accounts = await daos.accounts.accounts(userId);
                await Promise.all(accounts.map(async account => {
                    const balanceFuture = daos.transactions.balance(userId, {accountId: account.id});
                    const valueFuture = daos.investmentValue.getLatestValue(userId, account.id);
                    account.balance = await balanceFuture;
                    account.value = await valueFuture;
                }));

                return {accounts: accounts};
            });
        } catch (err) {
            console.error('Error while accessing accounts', err);
            throw Boom.internal('Error while accessing accounts', err);
        }
    },
};