# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /app
COPY . .
RUN yarn install --production
RUN npx playwright install
CMD ["node", "index.js"]
EXPOSE 3000