import stripNulls from './stripNulls.js';

const makeAccount = data => {
  if (data === undefined) {
    return undefined;
  }
  const account = stripNulls(data);
  account.hidden = account.hidden === 1;
  return account;
};

const DEFAULT_POSITION = 0;

export default class AccountsDao {
  constructor(query) {
    this.query = query;
  }

  async accounts(userId) {
    const accounts = await this.query(
      '  SELECT id, name, type, position, hidden ' +
        '    FROM account ' +
        '   WHERE user_id = ? ' +
        'ORDER BY type = "investment", position, name',
      userId
    );
    return accounts.map(makeAccount);
  }

  async account(userId, id) {
    const results = await this.query(
      'SELECT id, name, type, position, hidden ' +
        '  FROM account ' +
        ' WHERE user_id = ? ' +
        '   AND id = ?',
      userId,
      id
    );
    return makeAccount(results[0]);
  }

  create(userId, account) {
    return this.query(
      'INSERT INTO account (user_id, id, name, type, position) VALUES (?, ?, ?, ?, ?)',
      userId,
      account.id,
      account.name,
      account.type,
      account.position || DEFAULT_POSITION
    );
  }

  store(userId, account) {
    return this.query(
      'UPDATE account SET name = ?, type = ?, position = ?, hidden = ? WHERE user_id = ? AND id = ?',
      account.name,
      account.type,
      account.position || DEFAULT_POSITION,
      account.hidden,
      userId,
      account.id
    );
  }
}
