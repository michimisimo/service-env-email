# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Instala curl
RUN apt-get update && apt-get install -y curl

# Descarga y descomprime dockerize
RUN curl -sSL https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz -o dockerize.tar.gz && \
    file dockerize.tar.gz && \
    tar -xzvf dockerize.tar.gz -C /usr/local/bin && \
    rm dockerize.tar.gz

# Limpieza
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Expone el puerto que va a usar la API
EXPOSE 3002

# Configura el comando para iniciar la API
CMD ["node", "server.js"]