# Tazkarty Comprehensive State Machine Diagram

This document provides a detailed and integrated view of the state transitions within the **Tazkarty** ecosystem. It covers three interconnected lifecycles: **Booking/Ticket Lifecycle**, **Seat Availability Lifecycle**, and the **Payment Flow Lifecycle**.

## 1. Integrated System Overview
The diagram below illustrates how a user progresses from browsing to a completed booking, including failure paths and administrative overrides.

### Visual Diagram (Formal UML Style)
![Tazkarty Comprehensive State Machine](tazkarty_uml_state_machine_large.png)

---

## 2. Core State Transitions

### A. The Booking/Ticket Journey
| State | Transition Event | Next State | Description |
| :--- | :--- | :--- | :--- |
| **Browsing** | User selects seats | **Seat Selected** | Initial entry point. User is viewing layout. |
| **Seat Selected** | Click "Proceed to Checkout" | **Checkout** | Temporary lock initiated in DB. |
| **Checkout** | Click "Confirm & Pay" | **Processing Payment** | Information sent to payment gateway. |
| **Processing Payment**| Gateway Error / Decline | **Failed** | Payment could not be processed. |
| **Processing Payment**| Gateway Success | **Ticket Issued** | Booking confirmed, QR Code generated. |
| **Ticket Issued** | Admin Refund / User Cancel | **Cancelled** | Booking invalidated. |

### B. Seat Status Management
Seats are the most volatile entity, requiring strict state management to prevent double-booking.
*   **Available:** Default state. Visible and selectable by all users.
*   **Locked (Temporary):** Triggered when a user selects a seat. Typically lasts 10-15 minutes (defined by `locked_until` in schema).
*   **Booked:** Permanently reserved once payment is confirmed (`status: 'booked'`).
*   **Blocked by Admin:** Manual override for maintenance, VIP, or technical issues.
*   **Maintenance:** Seat is physically/logically unusable.

### C. Payment Lifecycle
*   **Initiated:** Transaction created in the database.
*   **Paid:** Secure callback received from gateway.
*   **Failed:** User abandoned or bank declined.
*   **Refunded:** Money returned to user via Admin dashboard.

---

## 3. Technical Implementation Details

### State Logic in Models
The backend enforces these states through Mongoose enums and middleware:

**Ticket Model (`backend/src/models/Ticket.js`):**
```javascript
status: {
  type: String,
  enum: ["booked", "cancelled", "pending", "refunded"],
  default: "pending"
}
```

**Train Booking Model (`backend/src/models/TrainBooking.js`):**
```javascript
status: {
  type: String,
  enum: ['pending', 'booked', 'cancelled', 'completed'],
  default: 'pending'
}
```

**Seat Model (`backend/src/models/Seat.js`):**
```javascript
status: {
  type: String,
  enum: ["available", "locked", "booked", "gap", "blocked", "maintenance", "disabled"],
  default: "available",
}
```

## 4. Administrative Control
Administrators have the power to transition states manually:
1.  **Force Release:** Unlocking seats that are stuck in a 'Locked' state.
2.  **Refund Approval:** Transitioning a `booked` ticket to `refunded`.
3.  **Event Shutdown:** Moving all seats for a specific `show_id` to `maintenance`.
