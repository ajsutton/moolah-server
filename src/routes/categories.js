module.exports = [
    {
        method: 'GET',
        path: '/api/categories/',
        config: require('../handlers/category/getCategories'),
    },
    {
        method: 'POST',
        path: '/api/categories/',
        config: require('../handlers/category/createCategory'),
    },
    {
        method: 'PUT',
        path: '/api/categories/{id}/',
        config: require('../handlers/category/putCategory'),
    }
];