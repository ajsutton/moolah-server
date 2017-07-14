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
    }
];