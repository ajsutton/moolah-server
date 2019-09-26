const Good = require('@hapi/good');

module.exports = server => {
    const config = server.configue('logging');
    const reporters = {};
    if (config.console.enabled) {
        reporters.console = [
            {
                module: '@hapi/good-squeeze',
                name: 'Squeeze',
                args: [config.console.levels],
            },
            {
                module: '@hapi/good-console',
            },
            'stdout',
        ];
    }
    if (config.file.enabled) {
        reporters.file = [{
            module: '@hapi/good-squeeze',
            name: 'Squeeze',
            args: [config.file.levels],
        }, {
            module: '@hapi/good-squeeze',
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