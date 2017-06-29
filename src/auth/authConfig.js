let config;
try {
    config = require('../../config/googleAuthConfig.json');
} catch (error) {
    console.warn("Failed to load config/googleAuthConfig.json. Authentication may not work.");
    config = {};
}

module.exports = config;