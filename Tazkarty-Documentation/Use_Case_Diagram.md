# Comprehensive Use Case Diagram - Tazkarty

The Use Case Diagram for **Tazkarty** defines the functional scope of the system by identifying the interactions between external actors (Users, Admins, and Systems) and the core functionalities provided by the platform.

## Visual UML Use Case Diagram
![Tazkarty Use Case Diagram](../screenshots/use_case_diagram.png)

---

## 1. Actors Definition

### Primary Actors (Human)
- **Guest (Unauthenticated):** An initial visitor who can browse events and interact with the AI discovery tool but cannot perform transactional actions.
- **Registered User:** An authenticated individual who inherits all Guest capabilities and can perform bookings, manage history, and process payments. (Generalization of Guest).
- **Administrator:** The service provider responsible for managing the platform's content, stadium configurations, and financial analytics.

### Secondary Actors (Supporting Systems)
- **Payment Gateway (Stripe):** Facilitates secure credit card processing and financial verification.
- **AI Engine (HuggingFace/Llama):** Provides the underlying intelligence for conversational discovery and recommendations.

---

## 2. Core Use Cases

### User-Centric Interactions
- **Browse Events:** Searching and filtering through sports, trains, and shows.
- **AI Conversational Discovery:** Finding the right event through natural language chat with Nada AI.
- **Select Seat Layout:** Choosing specific seats from dynamic, real-time SVG maps.
- **Make Payment:** The core transactional node involving external gateway verification.
- **Request Refund:** A formal request transition that moves a booking into the administrative review state.

### Administrative Interactions
- **Manage Stadiums & Halls:** Defining physical layouts, seat segments, and categories.
- **Manage Event Schedule:** Scheduling specific 'Shows' within the system.
- **Dashboard Analytics:** High-level overview of sales performance and user engagement.

---

## 3. Relationships & Constraints
- **<<include>>:** 'Make Payment' requires 'Verify User' to ensure session integrity.
- **<<extend>>:** 'Apply Promo Code' is an optional extension that occurs during the payment flow.
- **Generalization:** Registered User is a specialized version of a Guest with elevated permissions.
