const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
let db;

function openDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

function run(query, params = []) {
  const database = openDb();
  return new Promise((resolve, reject) => {
    database.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(query, params = []) {
  const database = openDb();
  return new Promise((resolve, reject) => {
    database.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(query, params = []) {
  const database = openDb();
  return new Promise((resolve, reject) => {
    database.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function init() {
  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      rating REAL,
      featured INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price_per_night REAL NOT NULL,
      capacity INTEGER NOT NULL,
      image_url TEXT,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      checkin_date TEXT NOT NULL,
      checkout_date TEXT NOT NULL,
      guests INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // Seed sample data if no hotels
  const countRow = await get('SELECT COUNT(*) as count FROM hotels');
  if (!countRow || countRow.count === 0) {
    await seedData();
  }
}

async function seedData() {
  const hotels = [
    {
      name: 'Oceanview Paradise',
      city: 'Goa',
      description: 'Beachfront resort with infinity pool and sunset views.',
      image_url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
      rating: 4.8,
      featured: 1,
    },
    {
      name: 'Skyline Grand Hotel',
      city: 'Mumbai',
      description: 'Luxury hotel in the heart of the city with rooftop lounge.',
      image_url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
      rating: 4.6,
      featured: 1,
    },
    {
      name: 'Serenity Hills Retreat',
      city: 'Manali',
      description: 'Cozy mountain resort surrounded by pine forests.',
      image_url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
      rating: 4.7,
      featured: 0,
    },
  ];

  for (const h of hotels) {
    const result = await run(
      'INSERT INTO hotels (name, city, description, image_url, rating, featured) VALUES (?, ?, ?, ?, ?, ?)',
      [h.name, h.city, h.description, h.image_url, h.rating, h.featured]
    );
    const hotelId = result.lastID;

    // Seed rooms for each hotel
    await run(
      'INSERT INTO rooms (hotel_id, name, price_per_night, capacity, image_url) VALUES (?, ?, ?, ?, ?)',
      [
        hotelId,
        'Deluxe Room',
        3500,
        2,
        'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
      ]
    );
    await run(
      'INSERT INTO rooms (hotel_id, name, price_per_night, capacity, image_url) VALUES (?, ?, ?, ?, ?)',
      [
        hotelId,
        'Family Suite',
        5200,
        4,
        'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
      ]
    );
  }
}

function getCities() {
  return all('SELECT DISTINCT city FROM hotels ORDER BY city ASC');
}

function getFeaturedHotels() {
  return all('SELECT * FROM hotels WHERE featured = 1 LIMIT 4');
}

function searchHotels({ city }) {
  if (!city) {
    return all('SELECT * FROM hotels');
  }
  return all('SELECT * FROM hotels WHERE city = ?', [city]);
}

function getHotelById(id) {
  return get('SELECT * FROM hotels WHERE id = ?', [id]);
}

function getRoomsByHotelId(hotelId) {
  return all('SELECT * FROM rooms WHERE hotel_id = ?', [hotelId]);
}

function getRoomById(id) {
  return get('SELECT * FROM rooms WHERE id = ?', [id]);
}

async function createBooking({ roomId, name, email, phone, checkin, checkout, guests }) {
  const result = await run(
    `INSERT INTO bookings
      (room_id, guest_name, guest_email, guest_phone, checkin_date, checkout_date, guests)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roomId, name, email, phone, checkin, checkout, guests]
  );
  return getBookingById(result.lastID);
}

function getBookingById(id) {
  return get(
    `SELECT b.*, r.name as room_name, r.price_per_night, h.name as hotel_name, h.city
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     JOIN hotels h ON r.hotel_id = h.id
     WHERE b.id = ?`,
    [id]
  );
}

function getAllBookings() {
  return all(
    `SELECT b.*, r.name as room_name, h.name as hotel_name, h.city
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     JOIN hotels h ON r.hotel_id = h.id
     ORDER BY b.created_at DESC`
  );
}

module.exports = {
  init,
  getCities,
  getFeaturedHotels,
  searchHotels,
  getHotelById,
  getRoomsByHotelId,
  getRoomById,
  createBooking,
  getBookingById,
  getAllBookings,
};

