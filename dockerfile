# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto que va a usar la API
EXPOSE 3002

# Configura el comando para iniciar la API
CMD ["node", "server.js"]