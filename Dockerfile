# build stage
FROM node:16.7-alpine

WORKDIR /app

COPY ./package*.json ./

RUN npm install -g npm@7.20.3

RUN npm install rimraf --save-dev

COPY . .

RUN npm run build

# production stage
FROM node:16.7-alpine

COPY --from=0 /app ./

EXPOSE 8080

CMD ["npm", "run", "start:prod"]