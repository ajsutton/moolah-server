const accountDao = require('../../db/accountDao');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            try {
                const accounts = await accountDao.accounts(session.getUserId(request));
                reply({accounts: accounts});
            } catch (err) {
                console.error('Error while accessing accounts', err);
                reply(err, 500);
            }
        },
    },
};