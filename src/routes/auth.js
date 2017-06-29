module.exports = [
    {
        method: 'GET',
        path: '/auth/',
        config: require('../handlers/auth/loginState'),
    },
    {
        method: '*',
        path: '/googleauth',
        config: require('../handlers/auth/googleLogin'),
    },
];