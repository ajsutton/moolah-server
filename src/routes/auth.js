module.exports = [
    {
        method: 'GET',
        path: '/auth/',
        config: require('../handlers/auth/loginState'),
    },
];