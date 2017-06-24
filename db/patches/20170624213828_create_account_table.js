var create_account_table = new Migration({
    up: function() {
        this.create_table('account', function(t) {
            t.integer('id', {not_null: true});
            t.string('name', {not_null: true});
            t.string('type', {not_null: true});
            t.integer('balance', {not_null: true});
            t.primary_key('id');
        });
    },
    down: function() {
        this.drop_table('account');
    },
});