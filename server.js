// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors()); // Enable CORS
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// MongoDB connection
mongoose.connect('mongodb+srv://sanjeevani:sanjeeVaniMeds@sanjeevani.exguf.mongodb.net/?retryWrites=true&w=majority&appName=sanjeevani', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Hit Schema
const hitSchema = new mongoose.Schema({
    count: { type: Number, default: 0 }
});

const Hit = mongoose.model('Hit', hitSchema);

// Initialize hit count if it doesn't exist
async function initializeHitCount() {
    const hit = await Hit.findOne({});
    if (!hit) {
        const newHit = new Hit({ count: 0 });
        await newHit.save();
    }
}

initializeHitCount().catch(err => console.error('Error initializing hit count:', err));

// Endpoint to handle API requests
app.post('/api/chat', async (req, res) => {
    const content = req.body.content;

    const url = 'https://api.blackbox.ai/api/chat';
    const data = {
        messages: [
            {
                content: `Please provide the following information for the medicine named "${content}":\n1. Composition (point-wise)\n2. Dosage according to different age groups and weight (in kg)\n3. Precautions for different people\n4. Type of medicine\n5. When to consume (before or after eating)\n6. When to stop consumption\n7. What does this medicine cure (uses)\nPlease keep the response short and easy to understand.`,
                role: 'user'
            }
        ],
        model: 'deepseek-ai/deepseek-llm-67b-chat',
        max_tokens: '1024'
    };

    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios.post(url, data, config);
        
        // Format the response to be point-wise
        const formattedResponse = response.data.replace(/(\d+\.\s)/g, '\n$1'); // Ensure each point starts on a new line
        res.json({ formattedResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Endpoint to get hit count
app.get('/api/hit', async (req, res) => {
    const hit = await Hit.findOne({});
    res.json({ count: hit.count });
});

// Endpoint to increment hit count
app.post('/api/hit', async (req, res) => {
    await Hit.updateOne({}, { $inc: { count: 1 } });
    const hit = await Hit.findOne({});
    res.json({ count: hit.count });
});

// Serve the HTML file and increment hit count
app.get('/', async (req, res) => {
    await Hit.updateOne({}, { $inc: { count: 1 } }); // Increment hit count on page load
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
