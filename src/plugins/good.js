const Good = require('good');

module.exports = server => {
    const config = server.configue('logging');
    const reporters = {};
    if (config.console.enabled) {
        reporters.console = [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [config.console.levels],
            },
            {
                module: 'good-console',
            },
            'stdout',
        ];
    }
    if (config.file.enabled) {
        reporters.file = [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [config.file.levels],
        }, {
            module: 'good-squeeze',
            name: 'SafeJson',
        }, {
            module: 'good-file',
            args: [config.file.path],
        }];
    }

    return {
        plugin: Good,
        options: {
            reporters,
        },
    };
};