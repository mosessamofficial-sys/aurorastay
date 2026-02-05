## AuroraStay – Hotel Booking Website

End‑to‑end hotel booking website built with **Node.js, Express, EJS, and SQLite** – ideal for a college project demo.

### Features

- **Modern landing page** with hero section, search form, and featured hotels.
- **Hotel search** by city (with optional dates and guests for UI).
- **Hotel details page** showing images, description, and available rooms.
- **Booking flow**:
  - Choose room type.
  - Enter guest details, dates, and guests count.
  - Booking is saved to a SQLite database.
  - Redirects to a **booking confirmation page**.
- **Admin bookings page** listing all bookings from the database.

### Tech stack

- **Backend**: Node.js, Express
- **Views**: EJS templates
- **Database**: SQLite (file `database.sqlite` in project root)
- **Styling**: Custom CSS with a modern, responsive layout

### How to run locally

1. **Install dependencies**

   ```bash
   cd hotel-booking
   npm install
   ```

2. **Start the app**

   ```bash
   npm start
   ```

3. Open in browser:

   ```text
   http://localhost:3000
   ```

The SQLite database and sample hotel/room data are created automatically on first run.

### Project structure

- `server.js` – Express app and routes
- `src/db.js` – SQLite setup, schema, and queries
- `views/` – EJS templates
  - `index.ejs` – home / landing page
  - `search.ejs` – hotel search results
  - `hotel.ejs` – hotel details + booking form
  - `booking.ejs` – booking confirmation
  - `admin-bookings.ejs` – admin view of all bookings
  - `partials/header.ejs`, `partials/footer.ejs` – shared layout
- `public/css/styles.css` – custom responsive styling
- `database.sqlite` – created at runtime, contains tables and sample data

### Good points to mention in your viva / report

- Demonstrates **full stack** development (frontend UI, backend routes, persistent DB).
- Uses **RESTful endpoints** for search, hotel details, and booking.
- Shows **data modeling**: `hotels`, `rooms`, `bookings` with relations.
- Clean separation of **views**, **static assets**, and **database logic**.

