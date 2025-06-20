const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not set');
  console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE || 'Not set');
  console.log('USE_LOCAL_DB:', process.env.USE_LOCAL_DB || 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nospoilers_dev';
  console.log('\nUsing connection string:', connectionString);
  
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('\nAttempting to connect...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Server time:', result.rows[0].now);
    
    // Test if tables exist
    console.log('\nChecking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables found:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check movies table
    const moviesCount = await pool.query('SELECT COUNT(*) FROM movies');
    console.log(`\nMovies in database: ${moviesCount.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPostgreSQL server is not running or not accepting connections.');
      console.error('Make sure PostgreSQL is running on localhost:5432');
    } else if (error.code === '3D000') {
      console.error('\nDatabase "nospoilers_dev" does not exist.');
      console.error('You need to create it first.');
    }
  } finally {
    await pool.end();
  }
}

// Set environment variables manually for testing
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nospoilers_dev';
process.env.DATABASE_TYPE = 'postgres';
process.env.USE_LOCAL_DB = 'true';

testConnection();