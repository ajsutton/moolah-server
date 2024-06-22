import { Migration } from "../migrate.js";

export default new Migration({
    up: function() {
        this.execute('ALTER TABLE account ADD COLUMN position int(16) NOT NULL default 0');
    },
    down: function() {
        this.execute('ALTER TABLE account DROP COLUMN position')
    },
});