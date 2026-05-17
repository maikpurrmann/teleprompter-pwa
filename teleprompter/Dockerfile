FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY server.js ./
COPY public/ ./public/
EXPOSE 8090
CMD ["node", "server.js"]
