# Imagen de desarrollo del frontend (Angular con Node).
# Sirve la aplicacion con ng serve y recarga al guardar.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200

CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "1500"]
