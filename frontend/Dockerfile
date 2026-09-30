FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* values are inlined into the bundle at build time, so the API
# base URL has to be provided as a build arg (docker-compose passes it in).
# Without it the app falls back to demo mode and never reaches the gateway.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 4000
CMD ["node", "server.js"]
