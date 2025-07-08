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
const DEFAULT_CURRENCY = 'AUD';

export default class AccountsDao {
  constructor(query) {
    this.query = query;
  }

  async accounts(userId) {
    const accounts = await this.query(
      '  SELECT id, name, type, position, hidden, currency, parent_id AS parentId ' +
        '    FROM account ' +
        '   WHERE user_id = ? ' +
        'ORDER BY type = "investment", position, name',
      userId
    );
    return accounts.map(makeAccount);
  }

  async account(userId, id) {
    const results = await this.query(
      'SELECT id, name, type, position, hidden, currency, parent_id AS parentId ' +
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
      'INSERT INTO account (user_id, id, name, type, currency, parent_id, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId,
      account.id,
      account.name,
      account.type,
      account.currency || DEFAULT_CURRENCY,
      account.parentId,
      account.position || DEFAULT_POSITION
    );
  }

  store(userId, account) {
    return this.query(
      'UPDATE account SET name = ?, type = ?, position = ?, hidden = ?, currency = ?, parent_id = ? WHERE user_id = ? AND id = ?',
      account.name,
      account.type,
      account.position || DEFAULT_POSITION,
      account.hidden,
      account.currency || DEFAULT_CURRENCY,
      account.parentId,
      userId,
      account.id
    );
  }
}
