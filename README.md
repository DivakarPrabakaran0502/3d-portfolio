# 🎨 Interactive 3D Portfolio Showcase

A full-stack, highly visual 3D web application featuring interactive Three.js graphics, a custom dark-mode design system, user authentication, and a full CRUD portfolio management dashboard.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=flat-square&logo=three.js)
![NodeJS](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?style=flat-square&logo=express)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Features

- 🌟 **3D Hero Animation**: Real-time 3D ambient scene with rotating geometries, interactive particle stars, lighting, and mouse-follow rotation built using Three.js.
- 🔐 **Authentication System**: Full register & login flow backed by Node.js, Express, JWT tokens, and bcrypt password hashing.
- 🎛️ **Interactive Dashboard**: Personal portfolio manager allowing users to add, edit, filter, and delete projects.
- 🎨 **Live 3D Previews**: Dynamic 3D canvas cards rendering customizable geometry shapes (Cube, Sphere, Torus, Octahedron, Icosahedron, Dodecahedron) with personalized color themes.
- 📱 **Fully Responsive**: Sleek UI with modern glassmorphism aesthetic, responsive sidebar, and adaptive grid layouts.

---

## 🛠️ Tech Stack

### **Frontend**
- HTML5, Vanilla CSS3 (Custom Design Tokens & Glassmorphism)
- JavaScript (ES6 Modules)
- [Three.js](https://threejs.org/) (WebGL 3D Rendering Engine)

### **Backend**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) REST API
- `jsonwebtoken` (JWT Authentication)
- `bcryptjs` (Password Hashing)
- JSON Flat-File Database Storage

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/DivakarPrabakaran0502/3d-portfolio.git
cd 3d-portfolio/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
node server.js
```

### 4. Open in browser
Navigate to `http://localhost:3001` in your browser.

---

## 📂 Project Structure

```text
3d-portfolio/
├── backend/
│   ├── server.js          # Express entry point & static server
│   ├── routes/            # Auth & Portfolio API endpoints
│   ├── middleware/        # JWT verification middleware
│   └── models/            # Data models & storage logic
└── frontend/
    ├── index.html         # 3D Hero Landing Page
    ├── login.html         # Authentication Page
    ├── dashboard.html     # Portfolio Dashboard Manager
    ├── css/               # Modular CSS styles
    └── js/                # Three.js 3D engine & app scripts
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
