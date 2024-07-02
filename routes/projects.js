const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const User = require('../models/user');

// LA VULNERABILITA' XSS E' PRESENTE NELLA VISUALIZZAZIONE DEI PROGETTI E NELLA CREAZIONE DI UN NUOVO PROGETTO
// QUESTO PERCHE' I DATI VENGONO INSERITI DIRETTAMENTE NEL TEMPLATE SENZA ESSERE SANIFICATI

const authMiddleware = require('../middleware/authMiddleware');

router.use(fileUpload());

// check if the user is admin
function isAdmin(req, res, next) {
  authMiddleware(req, res, () => {});
  if (!req.user) {
    res.status(401).send('Non autorizzato');
  }
  else if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).send('Vietato');
  }
}

// Visualizza tutti i progetti
router.get('/', isAdmin, async (req, res) => {
  const projects = await Project.find().populate('members');
  res.render('projects', { user: req.user, projects });
});

// Visualizza un singolo progetto
router.get('/:id', isAdmin, async (req, res) => {
  try {
    // Validazione dell'input: verifica che l'ID sia un ObjectId valido
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send('ID del progetto non valido');
    }

    const project = await Project.findById(req.params.id).populate('members');

    // Controllo dell'accesso: verifica se l'utente ha il diritto di visualizzare il progetto
    if (!project) {
      return res.status(404).send('Progetto non trovato');
    }
    res.render('project', { user: req.user, project });
  } catch (error) {
    // Gestione degli errori: log dell'errore e risposta all'utente
    console.error('Errore durante il recupero del progetto:', error);
    res.status(500).send('Errore interno del server');
  }
});

// Creazione di un nuovo progetto
router.post('/create', isAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).send('Nome e descrizione del progetto richiesti');
  }
  const project = new Project({ name, description });
  await project.save();
  res.redirect('/projects');
});

// Aggiungi un membro al progetto
router.post('/:id/add-member', isAdmin, async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    await Project.findByIdAndUpdate(req.params.id, { $push: { members: user._id } });
    res.redirect(`/projects/${req.params.id}`);
  }
  else {
    res.status(404).send('Utente non trovato');
  }
});

// Carica un documento al progetto
router.post('/:id/upload-document', isAdmin, async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nessun file è stato caricato');
  }

  // Validazione dell'ID del progetto
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).send('Progetto non trovato');
  }

  const file = req.files.document;

  // Controllo del tipo di file
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).send('Tipo di file non consentito');
  }

  // Pulizia del nome del file e generazione di un nome univoco
  const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const cleanName = uniqueSuffix + '-' + originalName;

  // Limitazione della dimensione del file
  const maxSize = 30 * 1024 * 1024; // 30MB
  if (file.size > maxSize) {
    return res.status(400).send('Il file supera la dimensione massima consentita (30 MB)');
  }

  // Ulteriore pulizia del nome del file e definizione del percorso di upload
  const uploadPath = path.join(__dirname, '../uploads/', cleanName);

  file.mv(uploadPath, async (err) => {
    if (err) return res.status(500).send(err);

    project.documents.push({ filename: cleanName });
    await project.save();
    res.redirect(`/projects/${req.params.id}`);
  });
});

// Genera PDF con informazioni del progetto
router.post('/:id/generate-pdf', isAdmin, async (req, res) => {
  const project = await Project.findById(req.params.id).populate('members').populate('documents');

  if (!project) {
    return res.status(404).send('Pogetto non trovato');
  }

 const htmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <title>Report - ${project.name}</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
      }
      .container {
        max-width: 800px;
        margin: auto;
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1, h2 {
        color: #0056b3;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin-bottom: 10px;
        background-color: #e9ecef;
        padding: 10px;
        border-radius: 5px;
      }
      p {
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${project.name}</h1>
      <p>Descrizione: ${project.description}</p>
      <h2>Membri</h2>
      <ul>
        ${project.members.map(member => `<li>${member.username}</li>`).join('')}
      </ul>
      <h2>Documenti allegati</h2>
      <ul>
        ${project.documents.map(document => `<li>${document.filename}</li>`).join('')}
      </ul>
    </div>
  </body>
</html>
`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials']
    });
    const page = await browser.newPage();

    // save htmlTemplate to a file
    fs.writeFileSync('temp.html', htmlTemplate);

    await page.goto(`file://${path.join(__dirname, '../temp.html')}`, { waitUntil: 'networkidle0' });
  
    const pdfBuffer = await page.pdf({ format: 'A4' });
    
    await browser.close();
    
    // delete the temporary file
    fs.unlinkSync('temp.html');

    res.set('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore generazione PDF');
  }
});

// Rende la cartella degli uploads accessibile solo agli admin
router.use('/uploads', isAdmin, express.static('uploads'));

module.exports = router;