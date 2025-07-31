const express = require("express")
const cors = require("cors")
const postgresPool = require("pg").Pool
const app = express()
const bodyParser = require("body-parser")

// CRITICAL: Use Render's port or fallback to 10000 (not 3005)
const port = process.env.PORT || 10000

// Add this for environment variables
require('dotenv').config()

// Updated CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Local development
    'https://profile-final-two.vercel.app'  // Your actual Vercel URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

// UPDATED: Database configuration with SSL/TLS support for Render
const pool = new postgresPool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "post@123", 
    database: process.env.DB_NAME || "Profiles",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    max: 10,
    // Add connection timeout and retry settings
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    // CRITICAL: SSL/TLS configuration for Render PostgreSQL
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
})

// Enhanced database connection test with SSL logging
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
        console.error('Database config:', {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            port: process.env.DB_PORT,
            ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
        });
        return;
    }
    console.log(`✅ Connected to Profiles Database Successfully!`)
    console.log(`📍 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`)
    console.log(`🔒 SSL: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`)
    release(); // Release the client back to the pool
})

// Create table if not exists (for new database)
const createTableIfNotExists = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "Profile_Data" (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                age INTEGER NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                date_of_birth DATE NOT NULL,
                gender VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Profile_Data table ready');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }
};

// Call table creation after a short delay
setTimeout(createTableIfNotExists, 2000);

// EMAIL VALIDATION API ENDPOINT
app.post('/api/validate-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Get API key from environment variables
        const API_KEY = process.env.MAILBOXLAYER_API_KEY;
        
        if (!API_KEY) {
            return res.status(500).json({ error: 'Email validation service not configured' });
        }
        
        // Make API call to MailboxLayer
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(
            `http://apilayer.net/api/check?access_key=${API_KEY}&email=${email}&smtp=1&format=1`
        );
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        // Check if API returned an error
        if (data.error) {
            throw new Error(data.error.info || 'API validation failed');
        }
        
        // Process the validation result
        const isValid = data.format_valid && data.mx_found && data.smtp_check && data.score >= 0.6;
        
        const result = {
            isValid: isValid,
            details: {
                format_valid: data.format_valid,
                mx_found: data.mx_found,
                smtp_check: data.smtp_check,
                score: data.score
            },
            suggestion: data.did_you_mean || null,
            result: isValid ? 'deliverable' : 'undeliverable',
            reason: !data.format_valid ? 'Invalid format' : 
                    !data.mx_found ? 'MX record not found' : 
                    !data.smtp_check ? 'SMTP check failed' : 
                    data.score < 0.6 ? 'Low quality score' : 'Valid',
            additionalInfo: {
                user: data.user,
                domain: data.domain,
                catch_all: data.catch_all,
                role: data.role,
                disposable: data.disposable,
                free: data.free
            }
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Email validation error:', error);
        res.status(500).json({ 
            error: 'Email validation service is currently unavailable. Please try again later.',
            details: error.message 
        });
    }
});

// DEBUG ENDPOINT - For testing database connection
app.get('/debug/profiles', async (req, res) => {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test basic connection
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful:', testResult.rows[0]);
        
        // Test profiles table
        const profilesResult = await pool.query('SELECT COUNT(*) FROM "Profile_Data"');
        console.log('✅ Profiles count:', profilesResult.rows[0].count);
        
        // Get sample profiles
        const sampleProfiles = await pool.query('SELECT * FROM "Profile_Data" LIMIT 3');
        console.log('✅ Sample profiles:', sampleProfiles.rows);
        
        res.json({
            success: true,
            timestamp: testResult.rows[0].now,
            profileCount: profilesResult.rows[0].count,
            sampleProfiles: sampleProfiles.rows,
            message: 'Database connection working',
            environment: {
                DB_HOST: process.env.DB_HOST,
                DB_NAME: process.env.DB_NAME,
                DB_USER: process.env.DB_USER,
                NODE_ENV: process.env.NODE_ENV,
                PORT: port,
                SSL_ENABLED: process.env.NODE_ENV === 'production'
            }
        });
        
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            message: 'Database connection failed'
        });
    }
});

// Test database connection endpoint with SSL info
app.get('/debug/db-test', async (req, res) => {
    try {
        console.log('Testing database connection...');
        console.log('DB Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
        });
        
        // Test basic connection
        const testResult = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful');
        
        // Test profiles table
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'Profile_Data'
        `);
        
        res.json({
            success: true,
            timestamp: testResult.rows[0].current_time,
            tableExists: tableCheck.rows.length > 0,
            environment: process.env.NODE_ENV,
            sslEnabled: process.env.NODE_ENV === 'production',
            dbConfig: {
                host: process.env.DB_HOST || 'Not set',
                user: process.env.DB_USER || 'Not set',
                database: process.env.DB_NAME || 'Not set',
                port: process.env.DB_PORT || 'Not set',
                ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
            }
        });
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.detail
        });
    }
});

// GET MOST RECENT PROFILE - Using simpler route pattern
app.get('/profiles/recent', (req, res) => {
    console.log('🔍 Fetching most recent profile...');
    const sql = 'SELECT * FROM "Profile_Data" ORDER BY id DESC LIMIT 1';
    pool.query(sql, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch recent profile' });
        }
        if (result.rows.length === 0) {
            console.log('No profiles found');
            return res.status(200).json(null);
        }
        console.log('✅ Recent profile fetched:', result.rows[0]);
        return res.status(200).json(result.rows[0])
    })
});

// GET SINGLE PROFILE BY ID
app.get('/profiles/:id', (req, res) => {
    const id = Number(req.params.id);
    console.log(`🔍 Fetching profile with ID: ${id}`);
    
    // Validate ID
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid profile ID' });
    }
    
    const sql = 'SELECT * FROM "Profile_Data" WHERE id=$1';
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        console.log('✅ Profile fetched successfully:', result.rows[0]);
        return res.status(200).json(result.rows[0])
    })
});

// GET ALL PROFILES WITH PAGINATION
app.get('/profiles', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`🔍 Fetching profiles - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Get total count
    const countSql = 'SELECT COUNT(*) FROM "Profile_Data"';
    
    pool.query(countSql, (err, countResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch profiles count' });
        }
        
        const totalProfiles = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProfiles / limit);
        
        console.log(`📊 Total profiles: ${totalProfiles}, Total pages: ${totalPages}`);
        
        // Get paginated profiles
        const sql = 'SELECT * FROM "Profile_Data" ORDER BY id DESC LIMIT $1 OFFSET $2';
        
        pool.query(sql, [limit, offset], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch profiles' });
            }
            
            console.log(`✅ Profiles fetched successfully: ${result.rows.length} profiles`);
            
            return res.status(200).json({
                profiles: result.rows,
                currentPage: page,
                totalPages: totalPages,
                total: totalProfiles,
                hasNext: page < totalPages,
                hasPrev: page > 1
            });
        });
    });
});

// CREATE NEW PROFILE
app.post('/profiles', async (req, res) => {
    const { name, age, email, phone_number, date_of_birth, gender } = req.body;
    
    console.log('🆕 Creating new profile:', { name, age, email, phone_number, date_of_birth, gender });
    
    // Basic validation
    if (!name || !age || !email || !phone_number || !date_of_birth || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO "Profile_Data" (name, age, email, phone_number, date_of_birth, gender)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, age, email, phone_number, date_of_birth, gender]
        );
        
        console.log('✅ Profile created successfully:', result.rows[0]);
        res.status(201).json({
            message: 'Profile created successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('❌ Database error:', err);
        if (err.code === '23505') {
            if (err.constraint === 'unique_email') {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// UPDATE PROFILE
app.put('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    const { name, age, email, phone_number, date_of_birth, gender } = req.body;
    
    console.log(`✏️ Updating profile ${id}:`, { name, age, email, phone_number, date_of_birth, gender });
    
    // Basic validation
    if (!name || !age || !email || !phone_number || !date_of_birth || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE "Profile_Data"
             SET name = $1, age = $2, email = $3, phone_number = $4, date_of_birth = $5, gender = $6
             WHERE id = $7 RETURNING *`,
            [name, age, email, phone_number, date_of_birth, gender, id]
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Profile updated successfully:', result.rows[0]);
            res.status(200).json({
                message: `Profile updated successfully for ID ${id}`,
                data: result.rows[0]
            });
        } else {
            console.log(`❌ Profile not found for ID ${id}`);
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error('❌ Database error:', err);
        if (err.code === '23505' && err.constraint === 'unique_email') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// DELETE PROFILE
app.delete('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting profile ${id}`);
    
    try {
        const result = await pool.query(
            'DELETE FROM "Profile_Data" WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Profile deleted successfully:', result.rows[0]);
            res.status(200).json({
                message: `Profile deleted successfully for ID ${id}`,
                data: result.rows[0]
            });
        } else {
            console.log(`❌ Profile not found for ID ${id}`);
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error('❌ Database error:', err);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: "Profile API is running successfully!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: port,
        sslEnabled: process.env.NODE_ENV === 'production'
    })
});

// Health check endpoint (important for Render)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: port,
        environment: process.env.NODE_ENV,
        sslEnabled: process.env.NODE_ENV === 'production'
    });
});

// CRITICAL: Bind to 0.0.0.0 instead of localhost for Render deployment
app.listen(port, '0.0.0.0', (err) => {
    if (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
    console.log(`🚀 Server running successfully on 0.0.0.0:${port}`)
    console.log(`🔗 API Base URL: http://0.0.0.0:${port}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🗄️ Database Host: ${process.env.DB_HOST || 'localhost'}`)
    console.log(`📊 Database Name: ${process.env.DB_NAME || 'Profiles'}`)
    console.log(`🔒 SSL/TLS: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`)
})
