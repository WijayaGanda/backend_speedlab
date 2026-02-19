const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./model/UserModel');
const Service = require('./model/ServiceModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/speedlabDB';

// Sample data
const users = [
  {
    name: 'Admin SpeedLab',
    email: 'admin@speedlab.com',
    password: 'admin123',
    phone: '081234567890',
    address: 'Jl. Bengkel No. 1',
    role: 'admin',
    isActive: true
  },
  {
    name: 'Owner SpeedLab',
    email: 'owner@speedlab.com',
    password: 'owner123',
    phone: '081234567891',
    address: 'Jl. Bengkel No. 1',
    role: 'pemilik',
    isActive: true
  },
  {
    name: 'Budi Customer',
    email: 'budi@example.com',
    password: 'budi123',
    phone: '081234567892',
    address: 'Jl. Customer No. 123',
    role: 'pelanggan',
    isActive: true
  }
];

const services = [
  {
    name: 'Service Rutin',
    description: 'Ganti oli, cek rem, cek rantai, cek ban, cek lampu',
    price: 150000,
    estimatedDuration: 60,
    isActive: true
  },
  {
    name: 'Ganti Oli',
    description: 'Ganti oli mesin + filter oli',
    price: 75000,
    estimatedDuration: 30,
    isActive: true
  },
  {
    name: 'Tune Up',
    description: 'Tune up mesin, ganti busi, setel karburator',
    price: 200000,
    estimatedDuration: 90,
    isActive: true
  },
  {
    name: 'Ganti Ban',
    description: 'Ganti ban luar dan dalam',
    price: 300000,
    estimatedDuration: 45,
    isActive: true
  },
  {
    name: 'Ganti Kampas Rem',
    description: 'Ganti kampas rem depan atau belakang',
    price: 100000,
    estimatedDuration: 45,
    isActive: true
  },
  {
    name: 'Service Berkala 1000 KM',
    description: 'Service berkala untuk motor baru atau habis overhaul',
    price: 100000,
    estimatedDuration: 60,
    isActive: true
  },
  {
    name: 'Service Berkala 3000 KM',
    description: 'Service berkala 3000 KM - ganti oli dan pengecekan rutin',
    price: 150000,
    estimatedDuration: 60,
    isActive: true
  },
  {
    name: 'Service Berkala 6000 KM',
    description: 'Service berkala 6000 KM - ganti oli, filter, dan pengecekan lengkap',
    price: 250000,
    estimatedDuration: 90,
    isActive: true
  },
  {
    name: 'Ganti Rantai & Gear',
    description: 'Ganti rantai dan gear set',
    price: 400000,
    estimatedDuration: 120,
    isActive: true
  },
  {
    name: 'Cuci Motor',
    description: 'Cuci motor lengkap dengan shampo khusus',
    price: 25000,
    estimatedDuration: 30,
    isActive: true
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await Service.deleteMany({});
    console.log('Existing data cleared');

    // Insert users
    console.log('\nInserting users...');
    const insertedUsers = await User.insertMany(users);
    console.log(`✓ ${insertedUsers.length} users inserted`);
    insertedUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.role}): ${user.email}`);
    });

    // Insert services
    console.log('\nInserting services...');
    const insertedServices = await Service.insertMany(services);
    console.log(`✓ ${insertedServices.length} services inserted`);
    insertedServices.forEach(service => {
      console.log(`  - ${service.name}: Rp ${service.price.toLocaleString()}`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@speedlab.com');
    console.log('  Password: admin123');
    console.log('\nOwner:');
    console.log('  Email: owner@speedlab.com');
    console.log('  Password: owner123');
    console.log('\nCustomer:');
    console.log('  Email: budi@example.com');
    console.log('  Password: budi123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit();
  }
}

// Run seeder
seedDatabase();
