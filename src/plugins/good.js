const Good = require('good');
module.exports = server => ({
    register: Good,
    options: {
        reporters: server.configue('logging:reporters'),
    },
});