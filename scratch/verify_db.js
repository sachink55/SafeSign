import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('\n✅ DATABASE VERIFICATION: SUCCESS!');
    console.log('✅ Connected to MongoDB Atlas successfully.');
    
    // Let's also check what collections exist to prove we have read access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections in your database:', collections.map(c => c.name).join(', ') || 'No collections yet (it is empty)');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ DATABASE VERIFICATION: FAILED!');
    console.error(err.message);
    process.exit(1);
  });
