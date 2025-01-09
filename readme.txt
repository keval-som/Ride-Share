How to run the application
Use: npm start

The .env provided with the code points towards the mongodb atlas cloud db. where there will be some sample rides posted for dates 17-20 December. 

The process that is generally followed is:
Driver-> post Ride -> Once rider requests a ride -> chat with driver and decide whether to accept or reject
Rider -> book a ride -> chat with driver for details -> if accepted you will receive an email saying ride is confirmed -> once the ride finishes receive a email containing the review form.  


P.S. -> When we mention the ride is finished, it means as soon as the current time passes the posted ride time, we mark it as finished and then the reviews are sent etc.

Features: 
User Authentication
Driver Ride Publication - Post Ride page
Ride Search and Booking  – Book ride page
Driver-Rider Communication and Ride Confirmation - Chats between the driver and rider
Review and Rating System - Once booking is done riders receive the link for review
My Rides Page - Ride History Page, My Posted Rides.
Reporting System- Once the ride is finished, a report button will be enabled on the RideHistory Page, where if a driver is reported more than 3 times, his account will get deleted
Ride Cancellations - Option visible on upcoming ride page
Reminders - email confirmation for booking Done