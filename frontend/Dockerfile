# Build only public, browser-visible configuration into the Vite bundle.
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

ARG VITE_API_BASE=/api/v1
ARG VITE_KAKAO_JS_KEY
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_KAKAO_JS_KEY=${VITE_KAKAO_JS_KEY}

RUN npm run build

# The runtime image contains only Caddy and the static build output.
FROM caddy:2.8-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy

EXPOSE 80 443
