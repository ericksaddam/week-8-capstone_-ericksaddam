import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_EMAIL = 'ericksaddam3@outlook.com';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/harambee';

async function makeAdmin() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find and update the user
    const result = await usersCollection.findOneAndUpdate(
      { email: TARGET_EMAIL },
      { 
        $set: { 
          role: 'admin',
          isBlocked: false,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (result.value) {
      const { _id, name, email, role, isBlocked, updatedAt } = result.value;
      console.log('User updated successfully:');
      console.log({ _id, name, email, role, isBlocked, updatedAt });
    } else {
      console.log(`No user found with email: ${TARGET_EMAIL}`);
      
      // List all users for debugging
      console.log('Available users:');
      const allUsers = await usersCollection.find({}, { projection: { name: 1, email: 1, role: 1, isBlocked: 1 } }).toArray();
      console.log(allUsers);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

makeAdmin();
