
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

# Stage 2 : production Nginx
FROM nginx:1.27-alpine AS prod

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Angular
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer ports HTTP et HTTPS
EXPOSE 80 443

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
