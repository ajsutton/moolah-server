import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(
      'ALTER TABLE account ADD COLUMN parent_id VARCHAR(255) DEFAULT NULL; CREATE INDEX idx_account_parent_id ON account (parent_id)'
    );
  },
  down: function () {
    this.execute(
      'ALTER TABLE account DROP COLUMN parent_id DROP INDEX parent_id; DROP INDEX idx_account_parent_id'
    );
  },
});
