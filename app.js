const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// Helmet serve per proteggere l'applicazione da alcune vulnerabilità
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

mongoose.connect('mongodb://localhost:27017/projecter', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // DA SETTARE IN PRODUZIONE
  //user: 'myappuser',
  //pass: 'myapppassword'
}).then(() => console.log('Connected to MongoDB')).catch(err => console.log('Failed to connect to MongoDB', err));

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
app.use(xss());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurazione del cookie di sessione
const SessionCookie =  {
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 60 * 24 * 2 //2 day
} 
app.use(session({
  genid:function(req){
    if ( (req.session) && (req.session.uid) ) {
      return req.session.uid + "_" + 123;
      //    return new Date().getTime().toString();

    } else {
      return new Date().getTime().toString();
    }
  },
  resave: false, //forces the session to be saved back to store
  httpOnly: true,
  name:'sessionID',
  secret: 'projectm@n@gement@pp',
  secure: true,
  saveUninitialized: true,
  cookie: SessionCookie
}))
// In questo modo il cookie è siuro evitando attacchi CSRF
app.use(cookieParser());

// Serve per far capire che è scritto in Express
app.disable('x-powered-by');

// EJS è un motore di template per generare HTML
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware per gestire gli errori
app.use((req, res, next) => {
  res.locals.errorMessage = req.session.errorMessage;
  delete req.session.errorMessage;
  next();
});

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

const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));