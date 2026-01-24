# Entity Relationship Diagram (ERD) - Tazkarty

This document provides a comprehensive ERD for the Tazkarty system using Chen's notation.

## ERD Diagram

![ERD Diagram](../screenshots/tazkarty_erd_chen_notation_1769270246286.png)

## Database Schema Logic (Mermaid)

```mermaid
graph TD
    %% Entities (Rectangles)
    User[User]
    Ticket[Event Ticket]
    TrainBooking[Train Booking]
    Show[Show/Match]
    Event[Event]
    Category[Category]
    Hall[Hall/Section]
    Venue[Venue/Stadium]
    Payment[Payment]
    Seat[Event Seat]
    Promo[Promo Code]
    Review[Review]

    %% Relationships (Diamonds)
    Books{Books}
    Reserves{Reserves}
    Of{Of}
    In{Takes Place In}
    Located{Located In}
    Belongs{Belongs To}
    PaidFor{Paid Via}
    Applied{Applied To}
    Writes{Writes}
    CatBy{Categorized By}

    %% Connections
    User -- "May" --- Books === "Must" ==> Ticket
    User -- "May" --- Reserves === "Must" ==> TrainBooking
    
    Ticket === "Must" === Of --- "May" --- Show
    Show === "Must" === In --- "May" --- Hall
    Hall === "Must" === Located --- "May" --- Venue
    Show === "Must" === Belongs --- "May" --- Event
    Event === "Must" === CatBy --- "May" --- Category
    
    Ticket === "Must" === PaidFor === "Must" === Payment
    TrainBooking === "Must" === PaidFor
    
    Promo -- "May" --- Applied --- "May" -- Ticket
    
    User -- "May" --- Writes === "Must" ==> Review
    Review === "Must" === Of
```
