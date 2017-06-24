const db = require('../db/database');

module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        handler: (request, reply) => {
            db.query('SELECT id, name, type, balance FROM account')
                .then(results => {
                    reply({accounts: results});
                })
                .catch(err => {
                    console.error("Error while accessing accounts", err);
                    reply(err, 500);
                });
        },
    },
];