import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(`
INSERT INTO transaction (user_id, id, type, date, account_id, amount) 
     SELECT user_id, id, 'openingBalance', NOW(), id, balance as amount 
	   FROM account;
ALTER TABLE account DROP COLUMN balance`);
  },
  down: function () {
    this.execute(`
ALTER TABLE account ADD COLUMN balance int(11);
UPDATE account SET balance = (SELECT amount FROM transaction WHERE transaction.id = account.id);
ALTER TABLE account MODIFY COLUMN balance int(11) NOT NULL`);
  },
});
