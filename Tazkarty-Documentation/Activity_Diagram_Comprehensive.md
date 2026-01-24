# Activity Diagram - Tazkarty System Flow

This diagram illustrates the comprehensive user journey through the Tazkarty system, including event booking, train reservations, and AI assistance.

## System Flow (Activity Diagram)

![Activity Diagram](../screenshots/activity_diagram_comprehensive.png)

### Diagram Logic (Mermaid Source)
```mermaid
graph TD
    Start(( )) --> Login[Login / Guest Access]
        Login --> Choice{Choose Service}
        Choice -->|Browse Events| Search[Search Events/Movies]
        Choice -->|Need Help| AI[Chat with AI Assistant]
        Choice -->|Travel| Train[Search Trains]
        
        AI -->|Recommendation| Search
        
        Search --> SelectEvent[Select Event]
        SelectEvent --> SelectSeat[Pick Seats from Map]
        
        Train --> SelectTrain[Select Train & Carriage]
        SelectTrain --> SelectTrainSeat[Select Train Seat]
        
        SelectSeat --> Checkout[Proceed to Checkout]
        SelectTrainSeat --> Checkout
        
        Checkout --> Promo{Apply Promo?}
        Promo -->|Yes| Valid{Valid?}
        Valid -->|Yes| Apply[Discount Applied]
        Valid -->|No| Checkout
        Apply --> Payment
        Promo -->|No| Payment[Select Payment Method]
        
    lane System / Backend
        Login -.->|Auth Check| DB[(Database)]
        Search -.->|Query| DB
        SelectSeat -.->|Lock Seat| DB
        AI -.->|NLP Processing| DB
        Apply -.->|Verify Code| DB
        
    lane Payment Gateway
        Payment --> Process{Process Transaction}
        Process -->|Success| Receipt[Generate QR Code & Receipt]
        Process -->|Failed| Retry[Payment Failed - Retry?]
        
    lane User
        Retry -->|Yes| Payment
        Retry -->|No| Start
        Receipt --> End(( ))
```

---

## Detailed Logic Description

1. **Authentication**: Users can browse as guests, but booking requires either session tracking or login (Standard Flow).
2. **AI Integration**: The AI Assistant acts as a conversational entry point that redirects users to specific events based on natural language queries.
3. **Real-time Locking**: When a seat is selected, the system triggers a temporary lock in the database to prevent double-booking.
4. **Promotion Engine**: Validates codes against expiry dates and usage limits before modifying the `total_price`.
5. **QR Code Generation**: Upon successful payment, the backend generates a unique ticket ID encoded into a QR code for security.

---
*Note: This diagram follows standard UML activity modeling practices.*
