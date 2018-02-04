module.exports = async function loadEarmarkBalance(userId, earmark, daos) {
    const {balance, saved, spent } = await daos.earmarks.balances(userId, earmark.id);
    earmark.balance = balance || 0;
    earmark.saved = saved || 0;
    earmark.spent = spent || 0;
};