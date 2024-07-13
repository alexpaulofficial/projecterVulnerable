const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// Helmet serve per proteggere l'applicazione da alcune vulnerabilità
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const authMiddleware = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
// Configurazione delle variabili d'ambiente
require('dotenv').config();

// HTTPS
/*const https = require("https");
const fs = require("fs");*/

const app = express();

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = `mongodb://${dbHost}:${dbPort}/${dbName}`;

mongoose.connect(connectionString).then(() => console.log('Connected to MongoDB')).catch(err => console.log('Failed to connect to MongoDB', err));

app.use(helmet());
// Limita il numero di richieste per un determinato periodo di tempo
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(
  mongoSanitize({
    onSanitize: ({ key }) => {
      console.warn(`This request[${key}] is sanitized`);
    },
  }),
);
// Pulisce i dati da eventuali attacchi XSS
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve per far capire che è scritto in Express
app.disable('x-powered-by');

// EJS è un motore di template per generare HTML
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const projectRoutes = require('./routes/projects');
app.use('/projects', projectRoutes);

app.get('/', authMiddleware, (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/profile', authMiddleware, (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  res.render('profile', { user: req.user });
});

const port = process.env.PORT || 3000;

/* Creazione del server HTTPS
https
  .createServer({
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
  },
  app)
  .listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
  });
*/

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});