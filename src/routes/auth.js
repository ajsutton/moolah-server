module.exports = [
    {
        method: 'GET',
        path: '/api/auth/',
        config: require('../handlers/auth/loginState'),
    },
    {
        method: 'DELETE',
        path: '/api/auth/',
        config: require('../handlers/auth/logout'),
    },
    {
        method: '*',
        path: '/api/googleauth',
        config: require('../handlers/auth/googleLogin'),
    },
    {
        method: '*',
        path: '/api/facebookauth',
        config: require('../handlers/auth/facebookLogin'),
    },
];