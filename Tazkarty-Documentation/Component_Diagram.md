# Component Diagram - Tazkarty

This diagram illustrates the internal components of the Tazkarty system and how they interact with each other and external services.

## System Components

```mermaid
graph TB
    subgraph "Frontend Layer (Angular 19)"
        UI[Angular Components]
        Services[Angular Services]
        SocketClient[Socket.IO Client]
        AuthGuard[Auth Guards]
        Interceptors[HTTP Interceptors]
    end

    subgraph "Backend Layer (Node.js/Express)"
        Router[Express Router]
        Middleware[Auth & RateLimit Middleware]
        Controllers[Business Controllers]
        AI_Svc[Hugging Face AI Service]
        Pay_Svc[Stripe Payment Service]
        SocketMgr[Socket.IO Manager]
    end

    subgraph "External Integration"
        HF((Hugging Face Hub))
        Stripe((Stripe API))
    end

    subgraph "Data Layer"
        DB[(MongoDB Atlas)]
    end

    %% Interactions
    UI --> Services
    Services --> Interceptors
    Interceptors -->|REST API| Router
    AuthGuard --> UI
    SocketClient <-->|WebSockets| SocketMgr
    
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> DB
    Controllers --> AI_Svc
    Controllers --> Pay_Svc
    
    AI_Svc <--> HF
    Pay_Svc <--> Stripe
    
    SocketMgr --> Controllers

    %% Styling
    style UI fill:#dae8fe,stroke:#6c8ebf
    style Services fill:#dae8fe,stroke:#6c8ebf
    style Router fill:#d5e8d4,stroke:#82b366
    style Controllers fill:#d5e8d4,stroke:#82b366
    style DB fill:#ffe6cc,stroke:#d79b00
    style HF fill:#f8cecc,stroke:#b85450
    style Stripe fill:#f8cecc,stroke:#b85450
```

### Component Breakdown

1.  **Frontend Layer**:
    *   **Angular Components**: Modular UI elements (Seat Selection, AI Chat, etc.).
    *   **Angular Services**: Handle data fetching and logic orchestration.
    *   **Interceptors**: Automatically attach JWT tokens to every outgoing request.

2.  **Backend Layer**:
    *   **Express Router**: Decouples URL path logic from business logic.
    *   **Controllers**: Contain the core processing for events, bookings, and train journeys.
    *   **Socket.IO Manager**: Synchronizes seat status across all connected clients in real-time.

3.  **Data Layer**:
    *   **MongoDB Atlas**: Stores users, events, tickets, and AI conversations using a schema-less approach for flexibility.

4.  **External Integration**:
    *   **Hugging Face AI**: Powers the "Nada" assistant using Meta-Llama-3-8B.
    *   **Stripe**: Handles the secure financial lifecycle of every ticket purchase.
