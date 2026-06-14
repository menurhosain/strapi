FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

# Stash entire public dir outside /app/public so the bind mount doesn't hide it
RUN cp -r /app/public /public-seed

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 1337

ENTRYPOINT ["/docker-entrypoint.sh"]
