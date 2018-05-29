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

    {
        method: 'PUT',
        path: '/api/earmarks/{earmarkId}/budget/{categoryId}/',
        config: require('../handlers/earmark/budget/setBudget'),
    },
    {
        method: 'GET',
        path: '/api/earmarks/{earmarkId}/budget/{categoryId}/',
        config: require('../handlers/earmark/budget/getBudget'),
    },
    {
        method: 'GET',
        path: '/api/earmarks/{earmarkId}/budget/',
        config: require('../handlers/earmark/budget/getBudgets'),
    }
];