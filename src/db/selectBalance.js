module.exports = function selectBalance(options, args) {
    let selectBalance;
    if (options.accountId === undefined) {
        selectBalance = 'SUM(t.amount) as balance';
    } else {
        selectBalance = 'SUM(IF(t.to_account_id = ?, -t.amount, t.amount)) as balance';
        args.push(options.accountId);
    }
    return selectBalance;
};