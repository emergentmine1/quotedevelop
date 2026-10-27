# Admin UI: build with Vite, serve the static files with nginx (port 8080 inside the container).
# VITE_* values are baked in at build time — pass them as build args (see docker-compose.yml).

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY . .

ARG VITE_BACKEND_URL=
ARG VITE_AUTH_MODE=demo
ARG VITE_OKTA_ISSUER=
ARG VITE_OKTA_CLIENT_ID=
ARG VITE_OKTA_IDP_ID=
ARG VITE_OKTA_SCOPES="openid profile email"
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_OKTA_ISSUER=$VITE_OKTA_ISSUER \
    VITE_OKTA_CLIENT_ID=$VITE_OKTA_CLIENT_ID \
    VITE_OKTA_IDP_ID=$VITE_OKTA_IDP_ID \
    VITE_OKTA_SCOPES=$VITE_OKTA_SCOPES
RUN yarn build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
