const uuidv4 = require('uuid/v4');
let config;
try {
    config = require('../../config/googleAuthConfig.json');
} catch (error) {
    console.warn('Failed to load config/googleAuthConfig.json. Authentication may not work.');
    config = {
        secureToken: uuidv4(),
        googleClientId: 'invalid',
        clientSecret: 'invalid',
    };
}

module.exports = config;