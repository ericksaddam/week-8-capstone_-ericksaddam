import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const TARGET_EMAIL = 'ericksaddam2@outlook.com';

async function makeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get the User model directly from the connection
    const User = mongoose.model('User');

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: TARGET_EMAIL },
      { 
        $set: { 
          role: 'admin',
          isBlocked: false 
        } 
      },
      { new: true }
    );

    if (updatedUser) {
      console.log('User updated successfully:');
      console.log({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        updatedAt: updatedUser.updatedAt
      });
    } else {
      console.log(`No user found with email: ${TARGET_EMAIL}`);
      console.log('Available users:');
      const users = await User.find({}, 'name email role isBlocked');
      console.log(users);
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
