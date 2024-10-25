# Usar la imagen base de Node.js
FROM node:18

# Crear y establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el archivo .env
COPY .env ./

# Copiar el resto del código
COPY . .

# Exponer el puerto en el que la app escucha
EXPOSE 3002
