const pool = require('./config/db');

const LOCATIONS = [
  'Gulshan 1, Dhaka', 'Gulshan 2, Dhaka', 'Banani, Dhaka',
  'Dhanmondi, Dhaka', 'Bashundhara R/A, Dhaka', 'Uttara Sector 4, Dhaka',
  'Uttara Sector 11, Dhaka', 'Mirpur DOHS, Dhaka', 'Mohakhali DOHS, Dhaka',
  'Baridhara Diplomatic Zone, Dhaka', 'Badda, Dhaka', 'Aftabnagar, Dhaka',
  'Khilgaon, Dhaka', 'Mohammadpur, Dhaka'
];

const ADJECTIVES = ['Luxury', 'Modern', 'Premium', 'Cozy', 'Spacious', 'Elegant', 'Minimalist', 'Classic', 'Exclusive', 'Beautiful'];

const PROPERTY_TYPES = ['3BHK Flat', '4BHK Apartment', 'Studio Apartment', 'Duplex House', 'Penthouse', '2BHK Flat'];
const FURNITURE_TYPES = ['L-Shaped Sofa', 'Teak Wood Dining Table', 'King Size Bed', 'Wooden Wardrobe', 'Glass Coffee Table', 'Ergonomic Office Chair', 'Bookshelf', 'TV Cabinet'];
const APPLIANCE_TYPES = ['Samsung 55" Smart TV', 'LG 1.5 Ton AC', 'Whirlpool Refrigerator', 'Bosch Washing Machine', 'Panasonic Microwave Oven', 'Sony Home Theater', 'Dyson Vacuum Cleaner'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate product details based on category
function generateData(category, index) {
  let title = '';
  let description = '';
  let price = 0;
  let attributes = {};
  let imageUrl = '';
  const loc = getRandom(LOCATIONS);
  const adj = getRandom(ADJECTIVES);

  if (category === 'house_sell') {
    title = `${adj} ${getRandom(PROPERTY_TYPES)} for Sale in ${loc.split(',')[0]}`;
    description = `An absolute masterpiece! This ${title.toLowerCase()} offers an incredible living experience with premium fittings, ample natural light, and top-tier security in the heart of the city. Perfect for families looking for a permanent, luxurious address.`;
    price = getRandInt(8500000, 35000000); // 85 Lakh to 3.5 Crore
    attributes = { beds: getRandInt(2, 5), baths: getRandInt(2, 4), size_sqft: getRandInt(1200, 3500) };
    imageUrl = `https://loremflickr.com/800/600/luxury,apartment,exterior/all?lock=${index}`;
  } 
  else if (category === 'house_rent') {
    title = `${adj} ${getRandom(PROPERTY_TYPES)} available for Rent in ${loc.split(',')[0]}`;
    description = `Looking for a comfortable home? We are renting out this ${adj.toLowerCase()} flat immediately. It features an open-plan living room, fully fitted kitchen, and secure parking. Very close to major supermarkets and schools.`;
    price = getRandInt(25000, 150000); // 25K to 1.5 Lakh per month
    attributes = { beds: getRandInt(1, 4), baths: getRandInt(1, 4), size_sqft: getRandInt(800, 2500) };
    imageUrl = `https://loremflickr.com/800/600/apartment,livingroom/all?lock=${index + 100}`;
  } 
  else if (category === 'furniture') {
    title = `${adj} ${getRandom(FURNITURE_TYPES)}`;
    description = `Selling this ${title.toLowerCase()} in excellent condition. Barely used and fits perfectly with any modern interior. Made from highly durable materials with an elegant finish. Transport must be arranged by the buyer.`;
    price = getRandInt(5000, 85000); // 5k to 85k
    attributes = { condition: getRandom(['Brand New', 'Like New', 'Good', 'Fair']), brand: getRandom(['Hatil', 'Otobi', 'IKEA', 'Navana', 'Brothers']) };
    imageUrl = `https://loremflickr.com/800/600/furniture,indoor/all?lock=${index + 200}`;
  } 
  else if (category === 'appliance') {
    title = `${getRandom(['Brand New', 'Slightly Used'])} ${getRandom(APPLIANCE_TYPES)}`;
    description = `Fully functional ${title}. Upgrading to a newer model so looking to sell this off quickly. Comes with all original accessories and power cables. Working perfectly without any issues.`;
    price = getRandInt(8000, 120000); // 8k to 1.2 Lakh
    attributes = { condition: getRandom(['New', 'Used - Like New', 'Used - Good']), warranty: getRandom(['6 Months Left', 'None', '1 Year Official']) };
    imageUrl = `https://loremflickr.com/800/600/appliance,electronics/all?lock=${index + 300}`;
  }

  return { title, description, price, location: loc, attributes, imageUrl };
}

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Ensure there's at least one seller user
    const [users] = await pool.query(`SELECT id FROM users`);
    if (users.length === 0) {
      await pool.query(`INSERT INTO users (full_name, email, password, role, is_verified, is_admin) VALUES ('System Admin', 'admin@thikana.com', 'hashedpassword', 'admin', 1, 1)`);
    }
    const [availableSellers] = await pool.query(`SELECT id FROM users LIMIT 10`);

    console.log('Clearing existing products and images to ensure a pristine catalog...');
    await pool.query('DELETE FROM products'); 
    // ^ This cascades to product_images and favorites, etc.

    const TARGET_COUNT = 100;
    const CATEGORIES = ['house_sell', 'house_rent', 'furniture', 'appliance'];
    
    console.log(`Generating ${TARGET_COUNT} realistic products...`);
    
    for (let i = 1; i <= TARGET_COUNT; i++) {
      const seller_id = getRandom(availableSellers).id;
      const category = getRandom(CATEGORIES);
      const data = generateData(category, i);
      
      const [insertResult] = await pool.query(
        `INSERT INTO products (seller_id, category, title, description, price, location, status, attributes) 
         VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)`,
        [seller_id, category, data.title, data.description, data.price, data.location, JSON.stringify(data.attributes)]
      );
      
      const productId = insertResult.insertId;

      await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)`,
        [productId, data.imageUrl]
      );
      
      // Optionally add a 2nd angled image for some products
      if (Math.random() > 0.5) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)`,
          [productId, `https://loremflickr.com/800/600/interior,design/all?lock=${i + 1000}`]
        );
      }

      if (i % 25 === 0) console.log(`✓ Inserted ${i} products...`);
    }

    console.log('🎉 Successfully seeded 100 highly realistic products with premium images!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
