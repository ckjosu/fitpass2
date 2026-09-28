# Imagen de desarrollo de la API (NestJS sobre Node).
# Monta el codigo como volumen y recompila al guardar.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 8000

# En desarrollo se usa el modo watch para no reconstruir la imagen cada cambio.
CMD ["npm", "run", "start:dev"]
