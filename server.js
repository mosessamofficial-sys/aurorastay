const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Home - list hotels / hero
app.get('/', async (req, res) => {
  try {
    const cities = await db.getCities();
    const featuredHotels = await db.getFeaturedHotels();
    res.render('index', { cities, featuredHotels });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Search results
app.get('/search', async (req, res) => {
  try {
    const { city, checkin, checkout, guests } = req.query;
    const hotels = await db.searchHotels({ city, checkin, checkout, guests });
    res.render('search', { hotels, city, checkin, checkout, guests });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Hotel detail
app.get('/hotel/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const hotel = await db.getHotelById(hotelId);
    if (!hotel) {
      return res.status(404).render('404', { message: 'Hotel not found' });
    }
    const rooms = await db.getRoomsByHotelId(hotelId);
    res.render('hotel', {
      hotel,
      rooms,
      errors: [],
      form: { room_id: '', name: '', email: '', phone: '', checkin: '', checkout: '', guests: 2 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Booking form submit
app.post('/book', async (req, res) => {
  try {
    const { room_id, name, email, phone, checkin, checkout, guests } = req.body;
    const errors = [];

    if (!room_id) errors.push('Please select a room type.');
    if (!name) errors.push('Name is required.');
    if (!email) errors.push('Email is required.');
    if (!checkin) errors.push('Check-in date is required.');
    if (!checkout) errors.push('Check-out date is required.');

    const guestsNum = parseInt(guests, 10) || 0;
    if (guestsNum <= 0) errors.push('Guests must be at least 1.');

    let checkinDate, checkoutDate;
    if (checkin && checkout) {
      checkinDate = new Date(checkin);
      checkoutDate = new Date(checkout);
      if (checkoutDate <= checkinDate) {
        errors.push('Check-out date must be after check-in date.');
      }
    }

    // If validation fails, re-render the hotel page with errors and previous values
    if (errors.length > 0) {
      const room = await db.getRoomById(room_id);
      const hotelId = room ? room.hotel_id : null;
      if (!hotelId) {
        return res.status(400).render('404', { message: 'Selected room no longer exists.' });
      }
      const hotel = await db.getHotelById(hotelId);
      const rooms = await db.getRoomsByHotelId(hotelId);
      return res.status(400).render('hotel', {
        hotel,
        rooms,
        errors,
        form: { room_id, name, email, phone, checkin, checkout, guests: guestsNum || 1 },
      });
    }

    const booking = await db.createBooking({
      roomId: room_id,
      name,
      email,
      phone,
      checkin,
      checkout,
      guests: guestsNum,
    });
    res.redirect(`/booking/${booking.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Booking confirmation
app.get('/booking/:id', async (req, res) => {
  try {
    const booking = await db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).render('404', { message: 'Booking not found' });
    }

    // Compute nights and total price estimate
    let nights = 1;
    if (booking.checkin_date && booking.checkout_date) {
      const inDate = new Date(booking.checkin_date);
      const outDate = new Date(booking.checkout_date);
      const diffMs = outDate - inDate;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) nights = diffDays;
    }
    const totalEstimate = nights * booking.price_per_night;

    res.render('booking', { booking, nights, totalEstimate });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Simple admin list of bookings
app.get('/admin/bookings', async (req, res) => {
  try {
    const bookings = await db.getAllBookings();
    res.render('admin-bookings', { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found' });
});

// Initialize DB then start server
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Hotel booking app running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });

