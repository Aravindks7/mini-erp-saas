# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
# Drizzle migrations and config are needed for runtime migration checks
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./

EXPOSE 3000

CMD ["npm", "start"]
