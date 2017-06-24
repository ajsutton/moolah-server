module.exports = {
    register: require('hapi-router'),
    options: {
        routes: 'src/routes/**/*.js',
    },
};