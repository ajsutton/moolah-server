module.exports = function selectBalance(options, args) {
    let selectBalance;
    if (options.hasCurrentAccount) {
        selectBalance = `SUM(IF(af.type != "investment", amount, 0)) -
                                SUM(IF(t.type = "transfer" AND at.type != "investment", amount, 0)) AS balance`;
    } else if (options.hasInvestmentAccount) {
        selectBalance = `SUM(IF(af.type = "investment", amount, 0)) -
                            SUM(IF(at.type = "investment", amount, 0)) AS balance`;
    } else if (options.accountId === undefined) {
        selectBalance = 'SUM(t.amount) as balance';
    } else {
        selectBalance = 'SUM(IF(t.to_account_id = ?, -t.amount, t.amount)) as balance';
        args.push(options.accountId);
    }
    return selectBalance;
};