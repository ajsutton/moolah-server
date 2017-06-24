const db = require('../db/database');

module.exports = [
    {
        method: 'GET',
        path: '/accounts/',
        handler: (request, reply) => {
            db.query('SELECT id, name, type, balance FROM account')
                .then(results => {
                    reply(results);
                })
                .catch(err => {
                    console.error("Caught error", err);
                    reply(err, 500);
                });
        },
    },
];