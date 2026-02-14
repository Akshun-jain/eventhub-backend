FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npx tsc

RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/server.js"]
