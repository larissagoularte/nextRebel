# Use uma imagem base adequada para o aplicativo Node.js
FROM node:latest

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie os arquivos de código-fonte do aplicativo para o contêiner
COPY . .

# Exponha a porta 80 para o servidor da web
EXPOSE 3000

RUN npm install -g serve

# Comando para iniciar o servidor da web Nginx em segundo plano
CMD ["serve"]