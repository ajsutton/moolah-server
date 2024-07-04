import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(
      'ALTER TABLE account ' +
        'ADD COLUMN saving_target INT(16) DEFAULT NULL, ' +
        'ADD COLUMN saving_start_date DATE DEFAULT NULL, ' +
        'ADD COLUMN saving_end_date DATE DEFAULT NULL'
    );
  },
  down: function () {
    this.execute(
      'ALTER TABLE account DROP COLUMN saving_target, DROP COLUMN saving_start_date, DROP COLUMN saving_end_date'
    );
  },
});
