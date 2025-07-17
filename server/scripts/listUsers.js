import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all users
    const users = await usersCollection.find({}).toArray();

    if (users.length === 0) {
      console.log('No users found in the database');
      return;
    }

    console.log(`Found ${users.length} user(s):`);
    console.log('----------------------------------------');
    
    users.forEach((user, index) => {
      console.log(`User #${index + 1}:`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role || 'user'}`);
      console.log(`  Is Admin: ${user.role === 'admin' ? 'Yes' : 'No'}`);
      console.log(`  Is Blocked: ${user.isBlocked ? 'Yes' : 'No'}`);
      console.log(`  Created: ${user.createdAt || 'N/A'}`);
      console.log('----------------------------------------');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

listUsers().catch(console.error);
