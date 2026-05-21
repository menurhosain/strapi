'use strict';

module.exports = {
    async afterCreate(event) {
        const { email } = event.result;

        if (!email) return;

        try {
            await strapi.service('plugin::email.email').send({
                to: email,
                subject: 'You\'re subscribed to SAH Newsletter',
                html: `
                    <h2>Thank you for subscribing!</h2>
                    <p>You've successfully subscribed to the SAH newsletter. We'll keep you updated with our latest news and projects.</p>
                    <br/>
                    <p>The SAH Team</p>
                `,
            });
        } catch (err) {
            strapi.log.error('[newsletter] Failed to send confirmation email:', err);
        }
    },
};
