FROM node:10-alpine
RUN mkdir -p /app
WORKDIR /app
COPY . /app
RUN npm install && npm run build
VOLUME /app/config
VOLUME /app/storage
EXPOSE 8082
ENV NODE_ENV=production
CMD ["node", "/app/lib/index.js"]
