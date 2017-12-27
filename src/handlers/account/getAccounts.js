const session = require('../../auth/session');
const db = require('../../db/database');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            try {
                const userId = session.getUserId(request);
                await db.withTransaction(request, async daos => {
                    const accounts = await daos.accounts.accounts(userId);
                    await Promise.all(accounts.map(async account => {
                        account.balance = await daos.transactions.balance(userId, account.id);
                    }));
                    reply({accounts: accounts});
                });
            } catch (err) {
                console.error('Error while accessing accounts', err);
                reply(err, 500);
            }
        },
    },
};