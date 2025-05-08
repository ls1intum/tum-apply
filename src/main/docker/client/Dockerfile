# build your Angular UI
FROM node:22-alpine AS ui-builder
WORKDIR /ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ .
RUN npm run build

# serve it
FROM nginx:stable-alpine
COPY --from=ui-builder /ui/dist/your-app /usr/share/nginx/html
# (you can also drop in a custom nginx.conf here)
EXPOSE 80
