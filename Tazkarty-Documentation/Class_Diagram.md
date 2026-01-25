# Comprehensive Class Diagram - Tazkarty

The Class Diagram for **Tazkarty** provides a structural view of the system, illustrating the static relationships, attributes, and operations of the core entities within the application.

## Visual UML Class Diagram
![Tazkarty Class Diagram](../screenshots/class_diagram.png)

---

## 1. Core Classes & Responsibilites

### User Management
- **User:** The central entity representing both Customers and Administrators. Handles authentication (`login`, `register`) and manages personal bookings.

### Event & Scheduling
- **Event:** Represents a generic entertainment or sports activity. Contains metadata like title, description, teams, and category.
- **Show:** A specific occurrence of an event at a particular time and place (Hall/Stadium). It manages pricing and its own set of seats.

### Infrastructure (Venues)
- **Stadium:** A large-scale venue for sports events.
- **Hall:** A specific section or room within a Venue or Stadium where a Show takes place.

### Inventory & Transactions
- **Seat:** Represents an individual bookable spot. Manages its own state (`available`, `locked`, `booked`) to ensure data consistency during high-traffic bookings.
- **Ticket:** The result of a successful booking. Aggregates multiple seats and links to a specific User and Show.
- **Payment:** Records the financial transaction history associated with a Ticket.

### Transportation (Trains)
- **TrainBooking:** Specialized booking flow for rail journeys.
- **TrainSeat:** Represents individual seats within a train carriage.

---

## 2. Relationships

| Relationship Type | Description |
| :--- | :--- |
| **Association (1..*)** | A User can have multiple Tickets and TrainBookings. |
| **Composition** | A Stadium is composed of multiple Halls/Sections. |
| **Aggregation** | A Ticket aggregates multiple Seats but the Seats exist independently of a single booking (until booked). |
| **Dependency** | A Show depends on an Event and a Hall for its definition. |

---

## 3. Key Operations (Methods)

- **User.viewBookings():** Retrieves all associated tickets and train reservations.
- **Show.reserveSeat():** Initiates a temporary database lock on a seat.
- **Ticket.calculateTotal():** Dynamically computes the final price based on selected seats and applied promo codes.
- **Payment.processPayment():** Communicates with the external Stripe API to finalize the transaction.
