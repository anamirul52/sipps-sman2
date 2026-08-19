require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const violationRoutes = require('./src/routes/violationRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const sanctionRoutes = require('./src/routes/sanctionRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// API Health Check
app.get('/api', (req, res) => {
    res.json({ success: true, message: 'API SMA Negeri 2 Salatiga is online!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sanctions', sanctionRoutes);
app.use('/api/users', userRoutes);

// Serve frontend static build if available (for all-in-one server deployments)
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({ success: true, message: 'Backend SMA Negeri 2 Salatiga is online!' });
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server internal' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;


