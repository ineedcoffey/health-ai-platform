FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# Geliştirme ortamı için nodemon kullanıyoruz
CMD ["npm", "run", "dev"]