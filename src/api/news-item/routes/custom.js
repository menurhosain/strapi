"use strict";

module.exports = {
    routes: [
        {
            method: "GET",
            path: "/news-items/:slug/adjacent",
            handler: "news-item.adjacent",
            config: {
                auth: false,
            },
        },
    ],
};
