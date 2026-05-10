FROM node:20-bullseye-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm start"]
