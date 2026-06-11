FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Build the Strapi admin panel
RUN npm run build

# Copy backup file for import
COPY backup-website-module-11-6-26.tar.gz /backup.tar.gz

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 1337

ENTRYPOINT ["/docker-entrypoint.sh"]
