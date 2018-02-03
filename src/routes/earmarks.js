module.exports = [
    {
        method: 'GET',
        path: '/api/earmarks/',
        config: require('../handlers/earmark/getEarmarks'),
    },
    {
        method: 'POST',
        path: '/api/earmarks/',
        config: require('../handlers/earmark/createEarmark'),
    },
    {
        method: 'PUT',
        path: '/api/earmarks/{id}/',
        config: require('../handlers/earmark/putEarmark'),
    },
    {
        method: 'GET',
        path: '/api/earmarks/{id}/',
        config: require('../handlers/earmark/getEarmark'),
    },
];