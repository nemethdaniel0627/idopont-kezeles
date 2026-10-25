# The whole app in one container (see DEPLOY.md): builds the React app, then runs the Express server,
# which serves the built app and the API on $PORT.

# 1. The React app
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public ./public
COPY src ./src
# react-scripts 3 needs the legacy OpenSSL provider on Node 17 and later
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# 2. The server, with the built app next to it (server.js serves ../build)
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server ./
COPY --from=build /app/build ../build
USER node
CMD ["node", "server.js"]
