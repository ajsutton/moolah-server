const setHeader = require('hapi-set-header');

module.exports = server => {
    setHeader(server, 'X-Content-Type-Options', 'nosniff');
};