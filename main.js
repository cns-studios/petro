const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;

const USERS = [
    { ign: 'p1', pw: 'PW_P1' },
    { ign: 'p2', pw: 'PW_P2' }
];

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'frontend')));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});



// Auth
app.post('/api/login', (req, res) => {
    const { ign, pw } = req.body;
    const user = USERS.find(u => u.ign === ign && u.pw === pw);

    console.log("received login request, processed: ", user)
    if (user) {
        res.cookie('auth_token', user.ign, { httpOnly: false });
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/verify', (req, res) => {
    const token = req.cookies.auth_token;
    const user = USERS.find(u => u.ign === token);
    console.log("verify req: ", token, user)

    if (user) {
        return res.json({ success: true, user: user.ign });
        console.log("approved req")
    }
    res.status(401).json({ success: false });
});



// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/ingame', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ingame.html'));
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
