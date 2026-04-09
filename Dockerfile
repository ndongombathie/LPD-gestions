
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_CLUSTER
ARG VITE_API_URL
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_CLUSTER=$VITE_REVERB_CLUSTER
ENV VITE_API_URL=$VITE_API_URL
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
