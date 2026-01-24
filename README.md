# 🎟️ Tazkarty - Smart AI Ticket Reservation System

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://tazkartyapp.netlify.app/)
[![Angular](https://img.shields.io/badge/Angular-19.0-DD0031.svg?logo=angular)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248.svg?logo=mongodb)](https://www.mongodb.com/)

**Tazkarty** is a modern, state-of-the-art ticket reservation platform designed for the Egyptian market. It provides a seamless experience for booking sports matches (stadiums), entertainment shows, and train journeys, all enhanced by an integrated AI assistant.

---

## ✨ Key Features

### 🤖 Smart AI Assistant (Nada)
*   **Conversational Booking:** Discover events and check availability through natural language.
*   **Intelligent Recommendations:** Get personalized match and show suggestions.
*   **24/7 Support:** Automated help for FAQs and booking guidance.

### 🏟️ Advanced Event Management
*   **Dynamic Seat Mapping:** interactive SVG-based seat selection for stadiums and theaters.
*   **Sports Focus:** Specialized flow for football matches, including team filters and stadium layouts.
*   **Real-time Availability:** Instant seat locking and status updates via Socket.IO.

### 🚆 Premium Train Reservations
*   **Journey Planning:** Easy search for Cairo-based rail expeditions.
*   **Carriage Selection:** Visual maps for first-class, VIP, and standard carriages.
*   **National ID Integration:** Simplified verification for secure travel.

### 💳 Secure & Global
*   **Stripe Integration:** Fully secure payment processing.
*   **Bilingual (AR/EN):** Full RTL support for a native Arabic experience.
*   **Dark Mode Aesthetics:** Premium glassmorphism design optimized for all devices.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 19 (Standalone Components, Signals API)
- **Styling:** Tailwind CSS (Custom Design System)
- **State Management:** Angular Signals & RxJS
- **Real-time:** Socket.IO Client

### Backend
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB with Mongoose ODM
- **Authenticaton:** JWT (JSON Web Tokens)
- **AI Integration:** Google Gemini API (Generative AI)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB Atlas account or local installation
- Stripe Account (for payments)
- Google AI Studio API Key (for the AI Assistant)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZiadNader1/Tazkarty-Smart-Ai-Ticket-reservation-system-.git
   cd tazkarty
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend/tazkarty-frontend
   npm install
   npm start
   ```

---

## 📂 Project Structure

```text
tazkarty/
├── backend/                # Node.js Express Server
│   ├── src/controllers/    # Business Logic
│   ├── src/models/         # Mongoose Schemas
│   ├── src/routes/         # API Endpoints
│   └── uploads/            # Local Asset Storage
├── Frontend/               # Angular 19 Application
│   ├── src/app/core/       # Guards, Services, Interceptors
│   ├── src/app/features/   # Feature modules (Auth, Events, Trains)
│   ├── src/app/shared/     # Reusable UI Components
│   └── public/             # Static Assets & SVGs
└── README.md
```

---

## 📸 Screenshots

| Home Page | AI Assistant | Seat Selection |
| :---: | :---: | :---: |
| ![Home](https://raw.githubusercontent.com/ZiadNader1/Tazkarty-Smart-Ai-Ticket-reservation-system-/main/Frontend/tazkarty-frontend/public/uploads/image-1766245354744.png) | ![AI](https://raw.githubusercontent.com/ZiadNader1/Tazkarty-Smart-Ai-Ticket-reservation-system-/main/Frontend/tazkarty-frontend/public/uploads/poster-1766850209731.png) | ![Seats](https://raw.githubusercontent.com/ZiadNader1/Tazkarty-Smart-Ai-Ticket-reservation-system-/main/Frontend/tazkarty-frontend/public/uploads/layout_image-1766850209732.png) |

---

## 👤 Developer

Developed with ❤️ by **Ziad Nader**.

- **LinkedIn:** [Ziad Nader](https://www.linkedin.com/in/ziad-nader-5b86a2303/)
- **GitHub:** [@ZiadNader1](https://github.com/ZiadNader1)
- **Facebook:** [Ziad Nader](https://www.facebook.com/ziad.naderii)

*Special thanks to all the friends and colleagues who supported this vision.*

---

## 📄 License
This project is for educational and portfolio purposes. All rights reserved.
