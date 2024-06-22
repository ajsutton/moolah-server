import accounts from '../routes/accounts.js';
import analysis from '../routes/analysis.js';
import auth from '../routes/auth.js';
import categories from '../routes/categories.js'
import earmarks from '../routes/earmarks.js'
import transactions from '../routes/transactions.js'

const routeLists = [
    accounts,
    analysis,
    auth,
    categories,
    earmarks,
    transactions,
];

export default async server => {
    await routeLists.forEach(async list => {
        await list.forEach(async route => {
            const config = (await route.config).default;
            server.route({
                method: route.method,
                path: route.path,
                handler: config.handler,
                options: {
                    auth: config.auth,
                    validate: config.validate
                }
            })
        });
    });
}