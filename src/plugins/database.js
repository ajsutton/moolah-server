module.exports = server => {
    const config = server.configue('database');
    const options = {
        settings: config,
        decorate: 'mysql',
    };
    return {
        plugin: require('hapi-mysql2'),
        options,
    };
};