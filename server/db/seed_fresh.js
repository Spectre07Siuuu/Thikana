/**
 * seed_fresh.js
 * High-quality, aesthetic, and fully verified seeding script.
 * Product Images: Rotating through 30+ premium verified Unsplash IDs.
 * Avatars: Reliable i.pravatar.cc service.
 * Password for Users: 123456
 * Password for Admin: 223236
 */
require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const USER_DATA = [
  { name: 'Asif Mustoba Sazzad', gender: 'M', role: 'buyer', email: 'sazzad@gmail.com', bio: 'Tech enthusiast and entrepreneur looking for a modern residence in Dhaka.' },
  { name: 'Arefin Iqram', gender: 'M', role: 'seller', email: 'iqram@gmail.com', bio: 'Specialist in premium teak furniture and designer home appliances with 10+ years of experience.' },
  { name: 'Nadia Sultana Mim', gender: 'F', role: 'seller', email: 'mim@gmail.com', bio: 'Real estate consultant specializing in Gulshan and Banani luxury apartments and commercial spaces.' },
  { name: 'Maine Uddin Shanto', gender: 'M', role: 'seller', email: 'shanto@gmail.com', bio: 'Focused on sustainable furniture, minimalist living, and eco-friendly home decor solutions.' },
  { name: 'Nabiul Islam Nabil', gender: 'M', role: 'seller', email: 'nabil@gmail.com', bio: 'Your trusted source for high-end electronics and smart home systems with official warranties.' },
  { name: 'Adiba Tahsin', gender: 'F', role: 'seller', email: 'tahsin@gmail.com', bio: 'Architect and curator of Nordic-style furniture collections for contemporary urban homes.' },
  { name: 'Sara Sadia Noor', gender: 'F', role: 'buyer', email: 'noor@gmail.com', bio: 'Corporate professional searching for an elegant, secure 3BHK rental in a prime location.' },
  { name: 'Mahmuda Haque Mohona', gender: 'F', role: 'seller', email: 'mohona@gmail.com', bio: 'Senior real estate agent specializing in exclusive luxury duplexes, penthouses, and heritage homes.' },
  { name: 'Mezabur Rahaman Rasel', gender: 'F', role: 'seller', email: 'rasel@gmail.com', bio: 'Passionate about smart lifestyle tech and providing premium home appliances for modern families.' },
  { name: 'Mirajul Abedin Saimun', gender: 'M', role: 'seller', email: 'saimun@gmail.com', bio: 'Quality-driven seller of durable home and office furniture at highly competitive market prices.' },
  { name: 'Nigar Sultana', gender: 'F', role: 'seller', email: 'sultana@gmail.com', bio: 'Helping families find their dream homes since 2020 with a focus on trust and transparency.' },
  { name: 'Mahira Mehek Riya', gender: 'F', role: 'seller', email: 'riya@gmail.com', bio: 'Interior design expert listing only the most aesthetic and functional spaces in Dhaka.' },
  { name: 'Cristiano Ronaldo', gender: 'M', role: 'seller', email: 'ronaldo@gmail.com', bio: 'Exclusive agent for world-class luxury properties and high-value residential assets for elite clientele.' },
  { name: 'Lionel Messi', gender: 'M', role: 'seller', email: 'messi@gmail.com', bio: 'Committed to providing premium, family-friendly apartments with world-class aesthetics and comfort.' }
];

const LOCATIONS = [
  'Gulshan 1, Dhaka', 'Gulshan 2, Dhaka', 'Banani, Dhaka',
  'Dhanmondi, Dhaka', 'Bashundhara R/A, Dhaka', 'Uttara Sector 4, Dhaka',
  'Uttara Sector 11, Dhaka', 'Mirpur DOHS, Dhaka', 'Mohakhali DOHS, Dhaka',
  'Baridhara Diplomatic Zone, Dhaka', 'Aftabnagar, Dhaka', 'Badda, Dhaka'
];

const CATEGORIES = ['house_sell', 'house_rent', 'furniture', 'appliance'];

// Deterministic picsum.photos seeds per category (reliable, no API key needed)
const IMAGE_IDS = {
  house_sell: [
    'house-sell-1', 'house-sell-2', 'house-sell-3',
    'house-sell-4', 'house-sell-5', 'house-sell-6'
  ],
  house_rent: [
    'house-rent-1', 'house-rent-2', 'house-rent-3',
    'house-rent-4', 'house-rent-5', 'house-rent-6'
  ],
  furniture: [
    'furniture-1', 'furniture-2', 'furniture-3',
    'furniture-4', 'furniture-5', 'furniture-6'
  ],
  appliance: [
    'appliance-1', 'appliance-2', 'appliance-3',
    'appliance-4', 'appliance-5', 'appliance-6'
  ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const buildUrl = (seed) => `https://picsum.photos/seed/${seed}/1200/800`;

async function seedFresh() {
  console.log('🌱 Starting Bulletproof Seeding Process...');

  try {
    const userPass = await bcrypt.hash('123456', 10);
    const adminPass = await bcrypt.hash('223236', 10);
    const sellerIds = [];

    // 1. Seed Admin
    console.log('👑 Seeding Admin (Spoidormon)...');
    const adminAvatar = `https://i.pravatar.cc/300?u=admin@thikana.com`;
    await pool.query(
      `INSERT INTO users (full_name, email, password, role, is_admin, avatar_url, phone, address, bio, is_verified, nid_verified) 
       VALUES (?, ?, ?, 'admin', 1, ?, ?, ?, 'Chief marketplace administrator overseeing all operations and safety.', 1, 1)`,
      ['Spoidormon', 'admin@thikana.com', adminPass, adminAvatar, '+8801700000000', 'Admin HQ, Dhaka']
    );

    // 2. Seed Users
    console.log('👥 Seeding 14 Users...');
    for (let i = 0; i < USER_DATA.length; i++) {
      const u = USER_DATA[i];
      const avatarUrl = `https://i.pravatar.cc/300?u=${u.email}`;
      const phone = `+8801${getRandInt(3, 9)}${getRandInt(1000000, 9000000)}`;
      const address = getRandom(LOCATIONS);

      const [result] = await pool.query(
        `INSERT INTO users (full_name, email, password, role, avatar_url, phone, address, bio, is_verified, nid_verified) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [u.name, u.email, userPass, u.role, avatarUrl, phone, address, u.bio]
      );

      if (u.role === 'seller') {
        sellerIds.push(result.insertId);
      }
    }

    // 3. Seed Products
    console.log('📦 Seeding 100 Premium Products...');
    for (let i = 1; i <= 100; i++) {
      const sellerId = getRandom(sellerIds);
      const category = getRandom(CATEGORIES);
      const loc = getRandom(LOCATIONS);
      const mainId = getRandom(IMAGE_IDS[category]);
      
      let title, description, price, attributes;
      const brand = getRandom(['Hatil', 'Otobi', 'IKEA', 'Navana', 'Samsung', 'LG', 'Sony', 'Dyson', 'Panasonic']);

      if (category === 'house_sell') {
        title = `Luxury ${getRandInt(3, 5)}BHK Mansion in ${loc.split(',')[0]}`;
        description = `An architectural masterpiece. This ${getRandInt(3, 5)}BHK home offers elite finishes, expansive living spaces, and top-tier security for premium living.`;
        price = getRandInt(18000000, 75000000);
        attributes = { beds: getRandInt(3, 6), baths: getRandInt(3, 5), size: `${getRandInt(2500, 5500)} sqft` };
      } else if (category === 'house_rent') {
        title = `Modern Designer Penthouse at ${loc.split(',')[0]}`;
        description = `Sophisticated urban living with panoramic views. Fully furnished with high-end designer pieces. Ideal for international standard living.`;
        price = getRandInt(55000, 350000);
        attributes = { beds: getRandInt(1, 4), baths: getRandInt(2, 4), floor: 'Penthouse' };
      } else if (category === 'furniture') {
        title = `Premium ${brand} Minimalist Sofa Set`;
        description = `Hand-crafted ${brand} edition furniture. Sustainable teak wood and premium upholstery. Perfect for sophisticated living rooms.`;
        price = getRandInt(25000, 250000);
        attributes = { material: 'Solid Wood', condition: 'Excellent', brand };
      } else {
        title = `${brand} Smart Flagship Home Appliance`;
        description = `Future-proof your home with AI-integrated high-efficiency tech from ${brand}. Includes full official warranty and energy-saving certification.`;
        price = getRandInt(20000, 450000);
        attributes = { type: 'Flagship Series', condition: 'Factory New', warranty: 'Official Support' };
      }

      const [pResult] = await pool.query(
        `INSERT INTO products (seller_id, category, title, description, price, location, status, attributes) 
         VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)`,
        [sellerId, category, title, description || '', price, loc, JSON.stringify(attributes)]
      );

      const productId = pResult.insertId;
      await pool.query(`INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`, [productId, buildUrl(mainId)]);
      
      // Secondary image
      const secId = getRandom(IMAGE_IDS[category]);
      await pool.query(`INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`, [productId, buildUrl(secId)]);

      if (i % 25 === 0) console.log(`   ✓ ${i} products inserted...`);
    }

    console.log('\n🎉 SUCCESS: Seeding complete with fixed images and data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seedFresh();
