const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const xss = require('xss');

const authMiddleware = require('../middleware/authMiddleware');
const weakSecret = '12345';


router.get('/login', authMiddleware, (req, res) => {
  if (req.cookies.token) {
    res.cookie('token', req.cookies.token, { httpOnly: true });
    //return res.redirect('/profile');
    res.redirect('/profile');
  }
  else {
  res.render('login', { user: null });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Invalid credentials');
  }

  const isMatch = await bcrypt.compare('' + password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }
  
  const token = jwt.sign({username: user.username, role: user.role, email: user.email }, weakSecret, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });

  res.redirect('/profile');
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const sanitizedUsername = xss(username);
  const sanitizedEmail = xss(email);
  try {
    const existingUser = await User.findOne({ sanitizedUsername });
    if (existingUser) {
      req.session.errorMessage = 'User already exists';
      return res.redirect('/auth/register');
    }
    // Sanificazione dei dati con XSS
    const hashedPassword = bcrypt.hashSync(password, 10);
    // Creazione di un nuovo utente
    const newUser = new User({ username: sanitizedUsername, password: hashedPassword, email: sanitizedEmail });
    await newUser.save();
    // Creazione del token JWT
    const token = jwt.sign({ username: sanitizedUsername, role: "user", email: sanitizedEmail }, weakSecret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/profile');
  } catch (err) {
    console.error('Error registering user:', err);
    req.session.errorMessage = 'An error occurred while registering the user';
    res.redirect('/auth/register');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

router.get('/register', (req, res) => {
  if (req.cookies.token) {
    res.cookie('token', req.cookies.token, { httpOnly: true });
    //return res.redirect('/profile');
    res.redirect('/profile');
  }
  else {
  res.render('register', { user: null });
  }
});

module.exports = router;