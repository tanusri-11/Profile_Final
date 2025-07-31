const express = require("express")
const cors = require("cors")
const postgresPool = require("pg").Pool
const app = express()
const bodyParser = require("body-parser")
const port = process.env.PORT || 3005

// Add this for environment variables
require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const pool = new postgresPool({
    user: "postgres",
    password: "post@123",
    database: "Profiles",
    host: "localhost",
    port: 5432,
    max: 10
})

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log(`Connected to Profiles Database Successfully!`)
    release(); // Release the client back to the pool
})

// EMAIL VALIDATION API ENDPOINT (NEW)
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

// 1. GET ALL PROFILES WITH PAGINATION (for home page - all profiles list)
app.get("/profiles", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countSql = 'SELECT COUNT(*) FROM "Profile_Data"';
    
    pool.query(countSql, (err, countResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch profiles count' });
        }
        
        const totalProfiles = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProfiles / limit);
        
        // Get paginated profiles
        const sql = 'SELECT * FROM "Profile_Data" ORDER BY id DESC LIMIT $1 OFFSET $2';
        
        pool.query(sql, [limit, offset], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch profiles' });
            }
            
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
})

// 2. GET SINGLE PROFILE BY ID (for editing)
app.get("/profiles/:id", (req, res) => {
    const id = Number(req.params.id);
    const sql = 'SELECT * FROM "Profile_Data" WHERE id=$1';
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        return res.status(200).json(result.rows[0])
    })
})

// 3. GET MOST RECENT PROFILE (for home page - recently added section)
app.get("/profiles/recent/latest", (req, res) => {
    const sql = 'SELECT * FROM "Profile_Data" ORDER BY id DESC LIMIT 1';
    pool.query(sql, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch recent profile' });
        }
        if (result.rows.length === 0) {
            return res.status(200).json(null); // No profiles yet
        }
        return res.status(200).json(result.rows[0])
    })
})

// 4. CREATE NEW PROFILE
app.post('/profiles', async (req, res) => {
    const { name, age, email, phone_number, date_of_birth, gender } = req.body;
    
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
        
        console.log('Profile saved:', result.rows[0]);
        res.status(201).json({
            message: 'Profile created successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Database error:', err);
        if (err.code === '23505') { // Unique constraint violation
            if (err.constraint === 'unique_email') {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// 5. UPDATE PROFILE
app.put('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    const { name, age, email, phone_number, date_of_birth, gender } = req.body;
    
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
            res.status(200).json({
                message: `Profile updated successfully for ID ${id}`,
                data: result.rows[0]
            });
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error('Database error:', err);
        if (err.code === '23505' && err.constraint === 'unique_email') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// 6. DELETE PROFILE
app.delete('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            'DELETE FROM "Profile_Data" WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length > 0) {
            res.status(200).json({
                message: `Profile deleted successfully for ID ${id}`,
                data: result.rows[0]
            });
        } else {
            res.status(404).json({ error: 'Profile not found' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Profile API is running successfully!" })
})

app.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server is running successfully on port: ${port}`)
    console.log(`API Base URL: http://localhost:${port}`)
})
