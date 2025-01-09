# Ride Share

Welcome to the Ride Share application! This project is designed to connect drivers and riders efficiently. Our application provides a seamless experience for users to post, search, book, and manage rides, ensuring a smooth and reliable service for all participants.

## How to Run the Application

To start the application, use the following command:
```bash
npm start
```

### Process Overview

#### Driver
1. Post a ride.
2. Once a rider requests a ride, chat with the rider to decide whether to accept or reject the request.

#### Rider
1. Book a ride.
2. Chat with the driver for details.
3. If accepted, you will receive an email confirming the ride.
4. After the ride finishes, you will receive an email with a review form.

**Note:** A ride is considered finished once the current time passes the posted ride time. At this point, reviews are sent out.

### Features

- **User Authentication**
- **Driver Ride Publication**: Post Ride page
- **Ride Search and Booking**: Book Ride page
- **Driver-Rider Communication and Ride Confirmation**: Chats between the driver and rider
- **Review and Rating System**: Riders receive a review link after booking
- **My Rides Page**: Ride History Page and My Posted Rides
- **Reporting System**: After a ride is finished, a report button is enabled on the Ride History Page. If a driver is reported more than three times, their account will be deleted.
- **Ride Cancellations**: Option available on the upcoming ride page
- **Reminders**: Email confirmation for booking
