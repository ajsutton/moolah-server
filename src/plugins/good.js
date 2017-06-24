const Good = require('good');
module.exports = {
    register: Good,
    options: {
        reporters: {
            console: [
                {
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{
                        response: '*',
                        log: '*',
                    }],
                },
                {
                    module: 'good-console',
                },
                'stdout',
            ],
        },
    },
};