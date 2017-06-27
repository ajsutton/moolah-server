let config;
try {
    config = require('../../config/googleAuthConfig.json');
} catch (error) {
    console.warn("Failed to load config/googleAuthConfig.json", error);
    config = {};
}

module.exports = config;