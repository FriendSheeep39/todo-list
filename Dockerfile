#FROM node:latest
#
#WORKDIR /usr/src/app
#
#COPY package*.json ./
#
#RUN npm install
#
#COPY *.ts ./
#
#COPY tsconfig.json ./
#
#EXPOSE 3000
#
#CMD [ "npm", "run", "server-dev"]

FROM node:latest AS build

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "server-dev"]