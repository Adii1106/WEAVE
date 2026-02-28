const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Path to store our uploaded whiteboard images
const uploadPath = path.join(__dirname, '../../uploads');

// Make sure the directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer config for handling the file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Just use a simple timestamp to keep names unique
        const fileName = Date.now() + '-' + file.originalname;
        cb(null, fileName);
    }
});

const upload = multer({ storage: fileStorage });

// POST endpoint for image uploads
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Return the full URL so the frontend can display it
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: publicUrl });
});

module.exports = router;
