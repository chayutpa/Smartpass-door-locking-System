# Stage 1: build ไฟล์ static ด้วย Node
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: เอาไฟล์ build แล้วไปเสิร์ฟด้วย nginx (image ผลลัพธ์เล็กกว่ามาก)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]