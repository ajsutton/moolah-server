const types = require('./types');
const session = require('../auth/session');

module.exports = {
    queryValidation: {
        account: types.id.default(undefined),
        from: types.date.default(undefined),
        to: types.date.default(undefined),
        earmark: types.id.default(undefined),
        category: types.arrayOf(types.id).default([]),
        scheduled: types.boolean.default(false),
        transactionType: types.transactionType.default(undefined),
    },
    async parseOptions(request, daos) {
        const userId = session.getUserId(request);
        const accountId = request.query.account;
        const earmarkId = request.query.earmark;
        const scheduled = request.query.scheduled;
        const from = request.query.from;
        const to = request.query.to;
        const categories = request.query.category;
        const transactionType = request.query.transactionType;

        if (accountId !== undefined && await daos.accounts.account(userId, accountId) === undefined) {
            throw 'Account not found';
        }
        if (earmarkId !== undefined && await daos.earmarks.earmark(userId, earmarkId) === undefined) {
            throw 'Earmark not found';
        }
        const loadedCategories = await Promise.all(categories.map(async categoryId => ({
            id: categoryId,
            category: await daos.categories.category(userId, categoryId),
        })));
        const missingCategories = loadedCategories.filter(data => data.category === undefined);
        if (missingCategories.length > 0) {
            throw 'Unknown category ' + missingCategories.map(data => data.id).join(', ');
        }
        return {accountId, scheduled, from, to, categories, earmarkId, transactionType};
    },
};