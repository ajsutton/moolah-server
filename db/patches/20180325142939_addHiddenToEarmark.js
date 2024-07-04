import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(
      'ALTER TABLE earmark ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false'
    );
  },
  down: function () {
    this.execute('ALTER TABLE earmark DROP COLUMN hidden');
  },
});
