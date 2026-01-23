# Tazkarty - System Architecture Diagram

## 📌 What is a System Architecture Diagram?

A **System Architecture Diagram** is a high-level visual representation that shows:
- The major components/layers of a system
- How these components interact with each other
- The flow of data between different parts
- External integrations and services

## 🎯 Benefits of System Architecture Diagram

| Benefit | Description |
|---------|-------------|
| **Clear Overview** | Provides a bird's-eye view of the entire system |
| **Communication** | Helps explain the system to stakeholders and team members |
| **Documentation** | Serves as technical reference for developers |
| **Onboarding** | Helps new team members understand the system quickly |
| **Interview Ready** | Demonstrates technical competence in system design |
| **Scalability Planning** | Identifies potential bottlenecks and scaling opportunities |

---

## 🏗️ Tazkarty System Architecture

### Architecture Pattern: **3-Tier Client-Server Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TAZKARTY SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT TIER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Angular 18 Frontend                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Core      │  │  Features   │  │   Shared    │  │   Models    │    │   │
│  │  │  Services   │  │  Modules    │  │ Components  │  │ Interfaces  │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                          │   │
│  │  Features: Auth | Events | Booking | Payments | Admin | AI Chat          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                          HTTP/HTTPS │ WebSocket (Socket.IO)                     │
│                                    ▼                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION TIER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Node.js + Express.js Backend                          │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                         MIDDLEWARE LAYER                          │   │   │
│  │  │   [CORS] [Auth/JWT] [Error Handler] [Rate Limiting] [Logging]    │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                  │                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                          ROUTES LAYER                             │   │   │
│  │  │  /users | /events | /bookings | /payments | /venues | /shows     │   │   │
│  │  │  /seats | /reviews | /notifications | /analytics | /ai-chat      │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                  │                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                       CONTROLLERS LAYER                           │   │   │
│  │  │  [20 Controllers handling business logic and request processing] │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                  │                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        SERVICES LAYER                             │   │   │
│  │  │  [Socket.IO] [AI Service - Hugging Face] [Cron Jobs]             │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                  │                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                         MODELS LAYER                              │   │   │
│  │  │  [18 Mongoose Models/Schemas for MongoDB]                         │   │   │
│  │  │  User | Event | Booking | Payment | Venue | Hall | Seat | Show   │   │   │
│  │  │  Review | Notification | PromoCode | Stadium | etc.              │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                            Mongoose ODM                                         │
│                                    ▼                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA TIER                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           MongoDB Database                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │  Users  │ │ Events  │ │Bookings │ │Payments │ │ Venues  │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │  Halls  │ │  Seats  │ │  Shows  │ │ Reviews │ │Stadiums │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                    │
│  │  Stripe API    │  │ Hugging Face   │  │  File Storage  │                    │
│  │  (Payments)    │  │  (AI Chat)     │  │  (Uploads)     │                    │
│  └────────────────┘  └────────────────┘  └────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT (DOCKER)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Docker Compose                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │   Frontend   │  │   Backend    │  │   MongoDB    │                  │   │
│  │  │  Container   │  │  Container   │  │  Container   │                  │   │
│  │  │  Port: 4200  │  │  Port: 5000  │  │ Port: 27017  │                  │   │
│  │  │  (Nginx)     │  │  (Node.js)   │  │   (Mongo 6)  │                  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│  │                            │                                            │   │
│  │                     Volume: mongo_data                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────┐     HTTP Request      ┌──────────┐    Mongoose Query    ┌──────────┐
│          │ ──────────────────▶  │          │ ──────────────────▶  │          │
│  Client  │                       │  Server  │                       │ Database │
│ (Angular)│ ◀──────────────────  │ (Node.js)│ ◀──────────────────  │ (MongoDB)│
│          │    JSON Response      │          │    BSON Documents    │          │
└──────────┘                       └──────────┘                       └──────────┘
     │                                   │
     │                                   │
     │    WebSocket (Real-time)          │           API Call
     │ ◀──────────────────────────▶     │ ─────────────────────────▶
     │         Socket.IO                 │        External Services
     │                                   │        (Stripe, AI, etc.)
```

---

## 📊 Component Summary

| Layer | Technology | Port | Purpose |
|-------|------------|------|---------|
| **Frontend** | Angular 18 + Nginx | 4200 | User Interface |
| **Backend** | Node.js + Express | 5000 | REST API + WebSocket |
| **Database** | MongoDB 6 | 27017 | Data Persistence |
| **Real-time** | Socket.IO | - | Notifications |
| **Payments** | Stripe | - | Payment Processing |
| **AI** | Hugging Face | - | Chat Assistant |
| **Container** | Docker Compose | - | Deployment |

---

## 🔑 Key Architectural Decisions

### 1. **Separation of Concerns**
- Frontend handles UI/UX only
- Backend handles business logic
- Database handles data persistence

### 2. **RESTful API Design**
- 20+ API endpoints following REST conventions
- JWT-based authentication

### 3. **Real-time Communication**
- Socket.IO for live notifications
- Seat availability updates in real-time

### 4. **Containerization**
- Docker for consistent deployment
- Easy scaling and portability

### 5. **External Service Integration**
- Stripe for secure payment processing
- Hugging Face for AI-powered chat

---

## 🎓 Architecture Pattern Classification

This project follows a **Monolithic 3-Tier Architecture** with:

| Pattern | Implementation |
|---------|---------------|
| **3-Tier** | Client → Server → Database |
| **MVC** | Models, Views (Angular), Controllers |
| **Service Layer** | Business logic abstraction |
| **Repository** | Mongoose ODM for data access |

---

*Generated for Tazkarty Ticketing System*
