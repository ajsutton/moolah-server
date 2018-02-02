const types = require('./types');
const session = require('../auth/session');

module.exports = {
    queryValidation: {
        account: types.id.default(undefined),
        from: types.date.default(undefined),
        to: types.date.default(undefined),
        category: types.arrayOf(types.id).default([]),
        scheduled: types.boolean.default(false),
    },
    async parseOptions(request, daos) {
        const userId = session.getUserId(request);
        const accountId = request.query.account;
        const scheduled = request.query.scheduled;
        const from = request.query.from;
        const to = request.query.to;
        const categories = request.query.category;

        if (accountId !== undefined && await daos.accounts.account(userId, accountId) === undefined) {
            throw 'Account not found';
        }
        const loadedCategories = await Promise.all(categories.map(async categoryId => ({
            id: categoryId,
            category: await daos.categories.category(userId, categoryId),
        })));
        const missingCategories = loadedCategories.filter(data => data.category === undefined);
        if (missingCategories.length > 0) {
            throw 'Unknown category ' + missingCategories.map(data => data.id).join(', ');
        }
        return {accountId, scheduled, from, to, categories};
    },
};