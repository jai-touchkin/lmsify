# ---- Stage 1: build ----
# "AS build" names this stage so stage 2 can copy from it
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# creates /app/dist
RUN npm run build

# ---- Stage 2: run ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# runtime dependencies only
RUN npm ci --omit=dev
# take ONLY dist/ from stage 1
COPY --from=build /app/dist ./dist
# don't run as root
USER node
CMD ["node", "dist/index.js"]