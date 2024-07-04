import { assert } from 'chai';
import dslUtils from './dslUtils.js';

export default class AccountsDsl {
  constructor(server, accountsByAlias, transactionsByAlias) {
    this.server = server;
    this.accountsByAlias = accountsByAlias;
    this.transactionsByAlias = transactionsByAlias;
  }

  async createAccount(args) {
    const options = Object.assign(
      {
        alias: undefined,
        name: 'Unnamed Account',
        type: 'bank',
        balance: 0,
        position: 0,
        date: undefined,
        statusCode: 201,
      },
      args
    );

    const response = await this.server.post(
      '/api/accounts/',
      {
        name: options.name,
        type: options.type,
        balance: options.balance,
        position: options.position,
        date: options.date,
      },
      options.statusCode
    );
    const account = JSON.parse(response.payload);

    if (options.alias) {
      this.accountsByAlias.set(options.alias, account);

      const transactionResponse = await this.server.get(
        `/api/transactions/${encodeURIComponent(account.id)}/`,
        200
      );
      this.transactionsByAlias.set(
        options.alias,
        JSON.parse(transactionResponse.payload)
      );
    }
  }

  async verifyAccount(args) {
    const options = Object.assign(
      {
        alias: null,
        balance: undefined,
        position: undefined,
        hidden: undefined,
        statusCode: 200,
      },
      args
    );
    const account = dslUtils.override(this.accountsByAlias.get(options.alias), {
      balance: options.balance,
      position: options.position,
      hidden: options.hidden,
    });
    const response = await this.server.get(
      `/api/accounts/${encodeURIComponent(account.id)}/`,
      options.statusCode
    );
    if (response.statusCode === 200) {
      assert.deepEqual(
        JSON.parse(response.payload),
        account,
        `Did not match account ${options.alias}`
      );
    }
  }

  async verifyAccounts(args) {
    const options = Object.assign(
      {
        statusCode: 200,
        accounts: undefined,
        latestValues: {},
      },
      args
    );
    const response = await this.server.get(
      '/api/accounts/',
      options.statusCode
    );
    if (options.accounts !== undefined) {
      const actualAccounts = JSON.parse(response.payload).accounts;
      const expectedAccounts = options.accounts.map(alias => {
        const account = Object.assign({}, this.getAccount(alias));
        if (options.latestValues[alias] !== undefined) {
          account.value = options.latestValues[alias];
        }
        return account;
      });
      assert.includeDeepMembers(
        actualAccounts,
        expectedAccounts,
        'Did not find all expected accounts.'
      );
    }
  }

  async modifyAccount(args) {
    const options = Object.assign(
      {
        alias: null,
        statusCode: 200,
        name: undefined,
        type: undefined,
        hidden: undefined,
      },
      args
    );
    const currentAccount = this.accountsByAlias.get(options.alias);
    const modifiedAccount = dslUtils.override(currentAccount, {
      name: options.name,
      type: options.type,
      balance: options.balance,
      hidden: options.hidden,
    });
    const response = await this.server.put(
      '/api/accounts/' + encodeURIComponent(currentAccount.id) + '/',
      modifiedAccount,
      options.statusCode
    );
    if (options.statusCode === 200) {
      this.accountsByAlias.set(options.alias, JSON.parse(response.payload));
    }
  }

  getAccount(alias) {
    if (this.accountsByAlias.has(alias)) {
      return this.accountsByAlias.get(alias);
    } else {
      throw new Error('Unknown account: ' + alias);
    }
  }

  async setValue(args) {
    const options = Object.assign(
      {
        account: null,
        statusCode: 201,
        date: undefined,
        value: undefined,
      },
      args
    );

    const account = this.accountsByAlias.get(options.account);
    await this.server.put(
      '/api/accounts/' +
        encodeURIComponent(account.id) +
        '/values/' +
        encodeURIComponent(options.date),
      options.value,
      options.statusCode
    );
  }

  async removeValue(args) {
    const options = Object.assign(
      {
        account: null,
        date: null,
        statusCode: 204,
      },
      args
    );

    const account = this.accountsByAlias.get(options.account);
    await this.server.delete(
      '/api/accounts/' +
        encodeURIComponent(account.id) +
        '/values/' +
        encodeURIComponent(options.date),
      options.statusCode
    );
  }

  async verifyValues(args) {
    const options = Object.assign(
      {
        account: undefined,
        from: undefined,
        to: undefined,
        offset: undefined,
        pageSize: undefined,
        expectValues: [],
        expectHasMore: false,
        valueCount: undefined,
        statusCode: 200,
      },
      args
    );
    const account = this.accountsByAlias.get(options.account);

    const queryArgs = dslUtils.formatQueryArgs({
      pageSize: options.pageSize,
      offset: options.offset,
      from: options.from,
      to: options.to,
    });
    const response = await this.server.get(
      `/api/accounts/${encodeURIComponent(account.id)}/values/${queryArgs}`,
      options.statusCode
    );
    const result = JSON.parse(response.payload);
    assert.deepEqual(result, {
      values: options.expectValues,
      hasMore: options.expectHasMore,
    });
  }
}
