module.exports = [
    {
        method: 'GET',
        path: '/auth/',
        config: require('../handlers/auth/loginState'),
    },
    {
        method: 'DELETE',
        path: '/auth/',
        config: require('../handlers/auth/logout'),
    },
    {
        method: '*',
        path: '/googleauth',
        config: require('../handlers/auth/googleLogin'),
    },
];