# Code & Compute Society (CCS) — Official Platform

> **Think. Code. Create.**  
> The official web portal and executive engineering platform for the Code & Compute Society (CCS).

---

## ⚡ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **3D Graphics & Animations**: Three.js, Custom 3D Logo Mesh Visualizer, Canvas Particle Background
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas with local JSON persistence fallback
- **Security & Authentication**: Bcrypt password hashing, AES-256 reversible credential encryption for Lead Coordinator vault, JWT authentication with 10-hour sliding session limit and auto-logout guard
- **Role-Based Portals**:
  - **Student Portal**: Project milestone tracking, submission repository links, faculty directives
  - **Faculty Council**: Project review desk, work assignment issuance, direct society directives, public broadcast delegation
  - **Coordinator Operations**: User credential provisioning, reversible credential vault, real-time privilege sharing, society broadcast ticker manager

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm / pnpm / yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
ADMIN_VAULT_SECRET=your_vault_encryption_secret_here
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. Running the Development Servers
Start both the Vite frontend and Express API backend:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

### 5. Production Build
```bash
npm run build
```

---

## 🔒 Security & Access Delegation
All user accounts feature cryptographic verification, automated session expiration clamping, and granular privilege delegation configurable by the Society Coordinator.

---

## 📄 License
© 2026 Code & Compute Society (CCS). All rights reserved.
