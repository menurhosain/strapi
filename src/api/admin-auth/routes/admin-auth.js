"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/admin-google-auth",
      handler: "admin-auth.googleLogin",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
