const express = require('express');
const { register, login, me } = require('../controller/authController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth(true), me);

module.exports = router;


