'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::news-page.news-page');
