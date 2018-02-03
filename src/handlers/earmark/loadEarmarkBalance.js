module.exports = async function loadEarmarkBalance(userId, earmark, daos) {
    const [balance, expenses, income ] = await Promise.all([
        await daos.transactions.balance(userId, {earmarkId: earmark.id}),
        await daos.transactions.balance(userId, {earmarkId: earmark.id, type: 'income'})
        ]);
};