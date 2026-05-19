'use strict';

module.exports = {
    async beforeCreate(event) {
        const ctx = strapi.requestContext.get();
        const user = ctx?.state?.user;
        if (user && !event.params.data.author_name) {
            const first = user.firstname ?? "";
            const last = user.lastname ?? "";
            event.params.data.author_name = `${first} ${last}`.trim();
        }
    },
};
