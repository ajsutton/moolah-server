const config = require('../../db/config').mysql;

module.exports = {
    register: require('hapi-plugin-mysql'),
    options: Object.assign({
        connectionLimit: 50,
    }, config),
};