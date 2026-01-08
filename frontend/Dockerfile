# Stage 1: Base
FROM node:20-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Development
FROM base as development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 3: Build
FROM base as build
RUN npm run build

# Stage 4: Production Serve
FROM nginx:alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
