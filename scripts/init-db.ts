/**
 * Database Initialization Script
 * Creates the Popup collection and verifies database connection
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

async function initDatabase() {
  try {
    // Dynamically import after env vars are loaded
    const { default: connectDB } = await import('../lib/mongodb');
    
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB successfully');

    // Initialize models to ensure collections exist
    // Collections are created automatically when first document is inserted
    // But we can verify the connection by checking if models are registered
    
    console.log('Initializing collections...');
    
    // Access the models to ensure they're registered with Mongoose
    // This will create the collections when first used
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection.db;
    
    if (db) {
      // List existing collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      console.log('Existing collections:', collectionNames);
      
      // Check if Popup collection exists (Mongoose uses lowercase plural: 'popups')
      if (!collectionNames.includes('popups')) {
        console.log('Creating Popup collection...');
        // Create collection explicitly
        await db.createCollection('popups');
        console.log('✓ Popup collection created');
      } else {
        console.log('✓ Popup collection already exists');
      }
      
      // Verify other collections
      const requiredCollections = ['sites', 'leads', 'events'];
      for (const collName of requiredCollections) {
        if (!collectionNames.includes(collName)) {
          await db.createCollection(collName);
          console.log(`✓ ${collName} collection created`);
        } else {
          console.log(`✓ ${collName} collection already exists`);
        }
      }
    }

    console.log('\n✓ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initDatabase();

