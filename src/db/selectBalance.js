export default function selectBalance(options, args) {
  let selectBalance;
  if (options.hasCurrentAccount) {
    selectBalance = `SUM(IF(af.type != "investment", ROUND(t.amount * %fromRate% / 1000000), 0)) -
                                SUM(IF(t.type = "transfer" AND at.type != "investment", ROUND(t.amount * %toRate% / 1000000), 0)) AS balance`;
  } else if (options.hasInvestmentAccount) {
    selectBalance = `SUM(IF(af.type = "investment", ROUND(t.amount * %fromRate% / 1000000), 0)) -
                            SUM(IF(at.type = "investment", ROUND(t.amount * %toRate% / 1000000), 0)) AS balance`;
  } else if (options.accountId === undefined) {
    selectBalance = 'SUM(ROUND(t.amount * %fromRate% / 1000000)) as balance';
  } else {
    selectBalance =
      'SUM(IF(t.to_account_id = ?, ROUND(-t.amount * %toRate% / 1000000), ROUND(t.amount * %fromRate% / 1000000))) as balance';
    args.push(options.accountId);
  }
  return selectBalance;
}
