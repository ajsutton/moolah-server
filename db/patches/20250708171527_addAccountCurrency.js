import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(
      'ALTER TABLE account ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT "AUD"'
    );
  },
  down: function () {
    this.execute('ALTER TABLE account DROP COLUMN currency');
  },
});
