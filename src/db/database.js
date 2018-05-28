const AccountDao = require('./accountDao');
const TransactionDao = require('./transactionDao');
const CategoryDao = require('./categoryDao');
const AnalysisDao = require('./analysisDao');
const EarmarkDao = require('./earmarkDao');
const BudgetDao = require('./budgetDao');

const typeCastRealNumbers = (field, next) => {
    if (field.type === 'NEWDECIMAL') {
        return parseFloat(field.string());
    }
    return next();
};

async function doQuery(connection, sql, ...args) {
    const [rows] = await connection.query({
        sql,
        typeCast: typeCastRealNumbers,
        values: args,
    });
    return rows;
}

function beginTransaction(connection) {
    return connection.beginTransaction();
}

function commit(connection) {
    return connection.commit();
}

function rollback(connection) {
    return connection.rollback();
}

function makeDaos(connection) {
    const query = doQuery.bind(undefined, connection);
    return {
        accounts: new AccountDao(query),
        transactions: new TransactionDao(query),
        categories: new CategoryDao(query),
        analysis: new AnalysisDao(query),
        earmarks: new EarmarkDao(query),
        budget: new BudgetDao(query),
    };
}

module.exports = {
    async withTransaction(request, action) {
        const connection = await request.server.mysql.pool.getConnection();
        try {
            const daos = makeDaos(connection);
            await beginTransaction(connection);
            const result = await action(daos);
            await commit(connection);
            return result;
        } catch (err) {
            rollback(connection);
            throw err;
        } finally {
            connection.release();
        }
    },
};