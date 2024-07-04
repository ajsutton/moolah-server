export default {
  auth: {
    strategy: 'session',
    mode: 'try',
  },
  handler: function (req) {
    if (!req.auth.isAuthenticated) {
      return { loggedIn: false };
    } else {
      const profile = req.auth.credentials;
      return { loggedIn: true, profile };
    }
  },
};
