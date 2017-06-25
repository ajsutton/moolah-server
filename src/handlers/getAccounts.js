const accountsDao = require('../db/accountsDao');

module.exports = {
    handler: {
        async: async function(request, reply) {
            try {
                const accounts = await accountsDao.accounts();
                reply({accounts: accounts});
            } catch (err) {
                console.error('Error while accessing accounts', err);
                reply(err, 500);
            }
        },
    },
};