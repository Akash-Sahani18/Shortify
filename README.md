# 🔗 Shortify – URL Shortener Backend (MERN)

Shortify is a production-ready **URL shortening service** built using **Node.js, Express, MongoDB**, and deployed on **AWS EC2** with **Nginx, PM2, custom domain, and HTTPS**.

It supports:
- Short URL generation
- Redirection with click tracking
- QR code generation
- JWT-based authentication
- Environment-based configuration (local & production)

---

## 🚀 Live Demo

- **LIVE URL:** [https://shrtfy.com ](https://www.shrtfy.cloud/)

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (MongoDB Atlas)
- Mongoose
- JWT Authentication
- NanoID
- QRCode

### DevOps & Deployment
- AWS EC2 (Ubuntu 22.04 – Free Tier)
- Nginx (Reverse Proxy)
- PM2 (Process Manager)
- Let’s Encrypt (SSL / HTTPS)
- Custom Domain (DNS-based routing)

---

## 🏗️ Architecture Overview
```
shortify/
├── client/ # React frontend
├── server/ # Node.js backend
│ ├── routes/
│ ├── models/
│ ├── index.js
│ └── .env
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `server` folder.

### Local Development
```env
PORT=3000
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
BASE_URL=http://localhost:3000
```
- Production (EC2)
```
PORT=3000
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
BASE_URL=https://yourdomain.com
```
## 🧪 Local Development Setup
1️⃣ Clone Repository
```
git clone https://github.com/yourusername/shortify.git
cd shortify/server
```

2️⃣ Install Dependencies
```
npm install
```
3️⃣ Start Backend
```
npm start
```

Backend runs at:
```
http://localhost:3000
```
## 🔌 API Endpoints
🔐 Login
```
POST /api/login
```
🔗 Create Short URL
```
POST /api/short
Content-Type: application/json

{
  "originalUrl": "https://example.com"
}
```
🔁 Redirect
```
GET /:shortCode
```
## ☁️ Deployment Guide (AWS EC2)
1️⃣ Launch EC2 Instance
```
Ubuntu 22.04
Instance type: t2.micro
Open ports: 22, 80, 443
```
2️⃣ Connect to EC2
```
ssh -i key.pem ubuntu@EC2_PUBLIC_IP
```
3️⃣ Install Dependencies
```
sudo apt update
sudo apt install -y nodejs npm nginx git
sudo npm install -g pm2
```
4️⃣ Clone & Setup Backend
```
git clone https://github.com/yourusername/shortify.git
cd shortify/server
npm install

Create .env (production values).
```
5️⃣ Start Backend with PM2
```
pm2 start index.js --name shortify-backend
pm2 save
pm2 startup
```
6️⃣ Deploy Frontend
```
cd ../client
npm install
npm run build

sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
```

7️⃣ Configure Nginx
```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
    }
}

```
Restart:
```
sudo systemctl restart nginx
```
8️⃣ Enable HTTPS (Let’s Encrypt)
```
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx
```
## 🔒 Security Features

- JWT-based authentication
- Environment variable configuration
- HTTPS enabled
- MongoDB Atlas network controls

## 📈 Future Improvements

- Rate limiting

- Admin dashboard

- Redis caching

- CI/CD with GitHub Actions

- Elastic Beanstalk migration

## 👨‍💻 Author
*Akash Sahani*  
📫 [GitHub](https://github.com/Akash-Sahani18) | [LinkedIn](https://www.linkedin.com/in/akash-sahani-440147243)
