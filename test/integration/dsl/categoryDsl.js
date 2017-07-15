const assert = require('chai').assert;
const dslUtils = require('./dslUtils');

module.exports = class CategoryDsl {
    constructor(server, categoriesByAlias) {
        this.server = server;
        this.categoriesByAlias = categoriesByAlias;
    }

    async createCategory(args) {
        const options = Object.assign({
            alias: undefined,
            name: 'Unnamed Category',
            parent: undefined,
            statusCode: 201,
        }, args);

        const response = await this.server.post('/api/categories/', {
            name: options.name,
        });
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        const category = JSON.parse(response.payload);

        if (options.alias) {
            this.categoriesByAlias.set(options.alias, category);
        }
    }

    async verifyCategories(args) {
        const options = Object.assign({
            categories: [],
            statusCode: 200,
        }, args);

        const expectedCategories = options.categories.map(alias => this.categoriesByAlias.get(alias));
        const response = await this.server.get('/api/categories/');
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');

        assert.deepEqual(JSON.parse(response.payload), {categories: expectedCategories});
    }

    async modifyCategory(args) {
        const options = Object.assign({
            alias: undefined,
            name: undefined,
            parent: undefined,
            statusCode: 200,
        }, args);

        const currentCategory = this.categoriesByAlias.get(options.alias);
        const modifiedCategory = dslUtils.override(currentCategory, {
            name: options.name,
            parentId: options.parent !== undefined ? this.categoriesByAlias.get(options.parent).id : undefined,
        });

        const response = await this.server.put(`/api/categories/${encodeURIComponent(modifiedCategory.id)}/`, modifiedCategory);
        assert.equal(response.statusCode, options.statusCode, 'Incorrect status code');
        if (options.statusCode === 200) {
            this.categoriesByAlias.set(options.alias, modifiedCategory);
        }
    }
};