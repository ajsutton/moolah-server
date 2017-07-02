const accountDao = require('../../db/accountDao');
const transactionDao = require('../../db/transactionDao');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            try {
                const userId = session.getUserId(request);
                const accounts = await accountDao.accounts(userId);
                await Promise.all(accounts.map(async account => {
                    account.balance = await transactionDao.balance(userId, account.id);
                }));
                reply({accounts: accounts});
            } catch (err) {
                console.error('Error while accessing accounts', err);
                reply(err, 500);
            }
        },
    },
};