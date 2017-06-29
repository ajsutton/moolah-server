const JWT = require('jsonwebtoken');
const authConfig = require('./authConfig');

module.exports = {
    getUser(req) {
        try {
            const token = JWT.verify(req.state.token, authConfig.jwtSecret);
            if (token.userId) {
                return token;
            }
            return null;
        } catch (error) {
            console.debug("JWT error: " + error.message);
            return null;
        }
    },

    getUserId(req) {
        const user = this.getUser(req);
        return user ? user.userId : null;
    },
};