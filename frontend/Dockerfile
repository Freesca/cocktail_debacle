FROM node:18-alpine

WORKDIR /app

# Copia package.json e installa dipendenze
COPY package*.json ./
RUN npm install

# Copia il resto (opzionale, verrà sovrascritto dal volume)
COPY . .

# Espone la porta del dev server Angular
EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]