
module.exports = server => {
    const config = server.configue('database');
    const options = {
        settings: `mysql://${config.user}:${config.password}@${config.host}/${config.database}?charset=${config.charset}&timezone=${config.timezone}&dateStrings=${config.dateStrings}&connectionLimit=${config.connectionLimit}`
    }
    return {
        register: require('hapi-mysql2'),
        options
    }
};