'use strict';

const DEFAULT_LOCALE = 'en';

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getDefaultSlug(documentId) {
  const entry = await strapi.documents('api::scope.scope').findOne({
    documentId,
    locale: DEFAULT_LOCALE,
    fields: ['slug'],
  });
  return entry?.slug ?? null;
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const locale = data.locale ?? event.params.locale;

    if (!locale || locale === DEFAULT_LOCALE) {
      if (!data.slug && data.name) data.slug = toSlug(data.name);
      return;
    }

    const documentId = data.documentId;
    if (!documentId) return;
    const slug = await getDefaultSlug(documentId);
    if (slug) data.slug = slug;
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    const locale = event.params.locale;
    if (!locale || locale === DEFAULT_LOCALE) return;

    const documentId = where?.documentId;
    if (!documentId) return;
    const slug = await getDefaultSlug(documentId);
    if (slug) data.slug = slug;
    else delete data.slug;
  },
};
