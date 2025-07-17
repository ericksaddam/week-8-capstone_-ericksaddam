import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserRole(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find the user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:');
    console.log({
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin',
      isBlocked: user.isBlocked || false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address as an argument');
  console.log('Example: node checkUserRole.js admin@example.com');
  process.exit(1);
}

checkUserRole(email).catch(console.error);
