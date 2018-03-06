const Boom = require('boom');

async function isInvalidToAccountId(transactionData, daos, userId) {
    const toAccount = await daos.accounts.account(userId, transactionData.toAccountId);
    return toAccount === undefined;
}

async function isInvalidEarmarkId(daos, userId, earmarkId) {
    return (await daos.earmarks.earmark(userId, earmarkId)) === undefined;
}

module.exports = async function validateTransaction(transaction, daos, userId) {
    const hasAccount = transaction.accountId !== undefined;
    if (hasAccount && (await daos.accounts.account(userId, transaction.accountId)) === undefined) {
        return Boom.badRequest('Invalid accountId');
    }
    if (!hasAccount && transaction.type !== 'income') {
        return Boom.badRequest('Earmarking funds must use income');
    }
    if (!hasAccount && (transaction.earmark === null || transaction.earmark === undefined)) {
        return Boom.badRequest('accountId or earmark required');
    }
    if (transaction.toAccountId !== undefined && transaction.toAccountId !== null && await isInvalidToAccountId(transaction, daos, userId)) {
        return Boom.badRequest('Invalid toAccountId');
    }
    if (transaction.recurEvery !== undefined && transaction.recurPeriod === undefined) {
        return Boom.badRequest('recurEvery is only applicable when recurPeriod is set');
    }
    if (hasAccount && transaction.accountId == transaction.toAccountId) {
        return Boom.badRequest('Cannot transfer to own account');
    }
    if (transaction.type === 'transfer' && (transaction.toAccountId === undefined || transaction.toAccountId === null)) {
        return Boom.badRequest('toAccountId is required when type is transfer');
    }
    if (transaction.type !== 'transfer' && (transaction.toAccountId !== undefined && transaction.toAccountId !== null)) {
        return Boom.badRequest('toAccountId invalid when type is not transfer');
    }
    if (transaction.earmark !== undefined && transaction.earmark !== null && await isInvalidEarmarkId(daos, userId, transaction.earmark)) {
        return Boom.badRequest('Invalid earmark');
    }
    return null;
};