'use strict';

const path = require('path');
const fs = require('fs');

const uiDistDir = path.dirname(require.resolve('swagger-ui-dist/package.json'));

let cachedSpec = null;
let cachedBundle = null;
let cachedCss = null;

function getSpec() {
  if (cachedSpec) return cachedSpec;

  const swaggerJsdoc = require('swagger-jsdoc');

  cachedSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'NextJS Backend API',
        version: '1.0.0',
        description: 'REST API documentation for the Strapi v5 backend',
      },
      servers: [{ url: 'http://localhost:1337', description: 'Local dev' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: [
      path.join(process.cwd(), 'src/api/**/controllers/*.js'),
      path.join(process.cwd(), 'src/docs/*.js'),
    ],
  });

  return cachedSpec;
}

function getBundle() {
  if (!cachedBundle) cachedBundle = fs.readFileSync(path.join(uiDistDir, 'swagger-ui-bundle.js'));
  return cachedBundle;
}

function getCss() {
  if (!cachedCss) cachedCss = fs.readFileSync(path.join(uiDistDir, 'swagger-ui.css'));
  return cachedCss;
}

// Separate JS file avoids inline scripts, satisfying CSP script-src 'self'
const initScript = `
window.onload = function () {
  SwaggerUIBundle({
    url: '/api-docs/swagger.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout',
  });
};
`;

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/api-docs/swagger-ui.css"/>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/swagger-ui-bundle.js"></script>
    <script src="/api-docs/swagger-init.js"></script>
  </body>
</html>`;

module.exports = (_config, _helpers) => {
  return async (ctx, next) => {
    switch (ctx.path) {
      case '/api-docs':
      case '/api-docs/':
        ctx.body = html;
        ctx.type = 'text/html';
        return;

      case '/api-docs/swagger.json':
        ctx.body = getSpec();
        ctx.type = 'application/json';
        return;

      case '/api-docs/swagger-ui-bundle.js':
        ctx.body = getBundle();
        ctx.type = 'application/javascript';
        ctx.set('Cache-Control', 'public, max-age=86400');
        return;

      case '/api-docs/swagger-ui.css':
        ctx.body = getCss();
        ctx.type = 'text/css';
        ctx.set('Cache-Control', 'public, max-age=86400');
        return;

      case '/api-docs/swagger-init.js':
        ctx.body = initScript;
        ctx.type = 'application/javascript';
        return;
    }

    await next();
  };
};
