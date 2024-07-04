export default {
  getUser(req) {
    if (!req.auth || !req.auth.isAuthenticated) {
      return null;
    } else {
      return req.auth.credentials;
    }
  },

  getUserId(req) {
    const user = this.getUser(req);
    return user ? user.userId : null;
  },
};
