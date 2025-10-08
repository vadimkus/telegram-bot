// Test database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test creating a user
    const testUser = await prisma.user.upsert({
      where: { telegramId: '123456789' },
      update: { genre: 'action' },
      create: { 
        telegramId: '123456789', 
        genre: 'action',
        contentType: 'movie'
      }
    });
    console.log('✅ Test user created:', testUser);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
