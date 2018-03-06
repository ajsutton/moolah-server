const session = require('../../auth/session');
const db = require('../../db/database');

module.exports = {
    auth: 'session',
    handler: async function(request, h) {
        try {
            const userId = session.getUserId(request);
            return await db.withTransaction(request, async daos => {
                const accounts = await daos.accounts.accounts(userId);
                await Promise.all(accounts.map(async account => {
                    account.balance = await daos.transactions.balance(userId, {accountId: account.id});
                }));

                return {accounts: accounts};
            });
        } catch (err) {
            console.error('Error while accessing accounts', err);
            throw Boom.internal('Error while accessing accounts', err);
        }
    },
};