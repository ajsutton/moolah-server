
module.exports = server => ({
    register: require('hapi-plugin-mysql'),
    options: server.configue('database'),
});