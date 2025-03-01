const express = require('express');
const User = require('../models/User');
const { hashPassword } = require('../utils/hash');
const router = express.Router();

function KTemail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// (Register)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }

        if (!KTemail(email)) {
            return res.status(400).json({ message: 'email hop le' });
        }
        const existsEmail = await User.findOne({ email });
        if (existsEmail) {
            return res.status(400).json({ message: 'Email đã tồn tại.' });
        }
        const hashPassword = hashPassword(password);

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: 'Đăng ký thành công', user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//API Đăng nhập (Login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại' });
        }

        if (hashPassword(password) !== user.password) {
            return res.status(401).json({ message: 'Sai mật khẩu' });
        }

        res.json({ message: 'Đăng nhập thành công', user });
    } catch (err) {
        res.status(500).json({ message, error: err.message });
    }
});

module.exports = router;
