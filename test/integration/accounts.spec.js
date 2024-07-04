import Dsl from './dsl/index.js';

describe('Account Management', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  it('should list accounts', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'cc',
      balance: 0,
    });
    await dsl.accounts.createAccount({
      alias: 'account2',
      name: 'Account 2',
      type: 'bank',
      balance: 5000,
    });

    await dsl.accounts.verifyAccounts({ accounts: ['account1', 'account2'] });
  });

  it('should create investment acounts', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'investment',
      balance: 0,
    });
    await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
  });

  describe('Investment Account Values', function () {
    it('should list investment values', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        name: 'Account 1',
        type: 'investment',
        balance: 100,
      });
      await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-06-30',
        value: 18000,
      });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-07-30',
        value: 40000,
      });
      await dsl.accounts.verifyValues({
        account: 'account1',
        from: '2022-01-01',
        to: '2022-12-31',
        expectValues: [
          { date: '2022-07-30', value: 40000 },
          { date: '2022-06-30', value: 18000 },
        ],
      });
    });

    it('should include latest value in account listing', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        name: 'Account 1',
        type: 'investment',
        balance: 100,
      });
      await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-07-30',
        value: 40000,
      });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-06-30',
        value: 18000,
      });
      await dsl.accounts.verifyAccounts({
        accounts: ['account1'],
        latestValues: { account1: 40000 },
      });
    });

    it('should remove a value', async function () {
      await dsl.accounts.createAccount({
        alias: 'account1',
        name: 'Account 1',
        type: 'investment',
        balance: 100,
      });
      await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-06-30',
        value: 18000,
      });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-07-30',
        value: 40000,
      });
      await dsl.accounts.setValue({
        account: 'account1',
        date: '2022-09-30',
        value: 50000,
      });
      await dsl.accounts.removeValue({
        account: 'account1',
        date: '2022-09-30',
      });
      await dsl.accounts.verifyValues({
        account: 'account1',
        from: '2022-01-01',
        to: '2022-12-31',
        expectValues: [
          { date: '2022-07-30', value: 40000 },
          { date: '2022-06-30', value: 18000 },
        ],
      });
      await dsl.accounts.verifyAccounts({
        accounts: ['account1'],
        latestValues: { account1: 40000 },
      });
    });
  });

  it('should modify an account', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'cc',
      balance: 0,
    });
    await dsl.accounts.modifyAccount({
      alias: 'account1',
      name: 'Modified Account',
      type: 'bank',
    });
    await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
  });

  it('should get a specific account', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'cc',
      balance: 0,
    });
    await dsl.accounts.verifyAccount({ alias: 'account1' });
  });

  it('should require a login to get an account', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'cc',
      balance: 0,
    });
    dsl.logout();
    await dsl.accounts.verifyAccount({ alias: 'account1', statusCode: 401 });
  });

  it('should require login to list accounts', async function () {
    dsl.logout();
    await dsl.accounts.verifyAccounts({ statusCode: 401 });
  });

  it('should require login to create accounts', async function () {
    dsl.logout();
    await dsl.accounts.createAccount({ statusCode: 401 });
  });

  it('should require login to modify accounts', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      name: 'Account 1',
      type: 'cc',
      balance: 0,
    });
    dsl.logout();
    await dsl.accounts.modifyAccount({ alias: 'account1', statusCode: 401 });
  });

  it('should default position to 0', async function () {
    await dsl.accounts.createAccount({
      alias: 'account1',
      position: undefined,
    });
    await dsl.accounts.verifyAccount({ alias: 'account1', position: 0 });
  });

  describe('Hidden Accounts', function () {
    it('should mark account as hidden', async function () {
      await dsl.accounts.createAccount({ alias: 'account1' });
      await dsl.accounts.verifyAccount({ alias: 'account1', hidden: false });

      await dsl.accounts.modifyAccount({ alias: 'account1', hidden: true });
      await dsl.accounts.verifyAccount({ alias: 'account1', hidden: true });
    });

    it('should still include hidden accounts in accounts list', async function () {
      await dsl.accounts.createAccount({ alias: 'account1' });

      await dsl.accounts.modifyAccount({ alias: 'account1', hidden: true });
      await dsl.accounts.verifyAccounts({ accounts: ['account1'] });
    });
  });
});
