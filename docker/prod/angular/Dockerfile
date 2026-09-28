# Imagen de produccion del frontend: se compila Angular y lo sirve nginx.
# El contexto de build es la raiz del proyecto para poder tomar tambien
# el archivo de configuracion de nginx que vive en docker/prod/angular/.
FROM node:22-alpine AS build
WORKDIR /app
COPY app-angular/package*.json ./
RUN npm install
COPY app-angular/ ./
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/gymred-panel-web/browser /usr/share/nginx/html
COPY docker/prod/angular/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
