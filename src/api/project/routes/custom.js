"use strict";

module.exports = {
    routes: [
        {
            method: "GET",
            path: "/projects/:slug/adjacent",
            handler: "project.adjacent",
            config: {
                auth: false,
            },
        },
    ],
};
