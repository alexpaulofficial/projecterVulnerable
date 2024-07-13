# 🏗️ PROJECTER (Project Management Platform)

## Descrizione

Questa piattaforma è stata progettata per gestire progetti di team, fornendo funzionalità per creare e visualizzare progetti, aggiungere membri e generare report in PDF. <u>La piattaforma include diverse vulnerabilità intenzionali per scopi didattici, specificamente per l'ethical hacking.</u>

## Struttura del Progetto

### Cartelle e File Principali

- `app.js`: Il file principale che avvia l'applicazione Express.
- `routes/`: Contiene le definizioni delle rotte per autenticazione e gestione dei progetti.
  - `auth.js`: Gestione delle rotte di autenticazione.
  - `projects.js`: Gestione delle rotte relative ai progetti.
- `models/`: Contiene i modelli Mongoose per la gestione dei dati.
  - `user.js`: Modello per gli utenti.
  - `project.js`: Modello per i progetti.
  - `document.js`: Modello per i documenti caricati in ogni progetto.
- `views/`: Contiene i file EJS per il rendering delle pagine HTML.
  - `index.ejs`: Homepage.
  - `login.ejs`: Pagina di login.
  - `register.ejs`: Pagina di registrazione.
  - `projects.ejs`: Pagina che elenca tutti i progetti.
  - `project.ejs`: Pagina dettagliata di un singolo progetto.
- `public/`: Contiene i file statici come CSS e JavaScript.
- `uploads/`: Contiene i file dei documenti caricati nei progetti.

## Funzionalità

### Autenticazione

- **Registrazione**: Gli utenti possono registrarsi tramite la pagina di registrazione.
- **Login**: Gli utenti registrati possono accedere alla piattaforma.
- **Logout**: Gli utenti possono disconnettersi dalla piattaforma.

### Gestione Progetti (ROTTA DISPONIBILE SOLO PER UTENTI "ADMIN")

- **Creazione Progetto**: Gli utenti autenticati possono creare nuovi progetti.
- **Visualizzazione Progetti**: Gli utenti possono visualizzare i dettagli di un progetto, inclusi membri e contenuti.
- **Aggiunta Membri**: Gli utenti possono aggiungere altri utenti come membri del progetto.
- **Generazione PDF**: Gli utenti possono generare un report PDF che include il contenuto HTML del progetto.

## Elenco delle Rotte

### Rotte Pubbliche

1. **GET /auth/login**
   
   - Descrizione: Visualizza la pagina di login.
   - Autenticazione: Non richiesta.

2. **POST /auth/login**
   
   - Descrizione: Effettua il login e genera un JWT.
   - Autenticazione: Non richiesta.

3. **GET /auth/register**
   
   - Descrizione: Visualizza la pagina di registrazione.
   - Autenticazione: Non richiesta.

4. **POST /auth/register**
   
   - Descrizione: Registra un nuovo utente.
   - Autenticazione: Non richiesta.

#### Rotte Protette (Richiedono Autenticazione)

1. **GET /auth/logout**
   
   - Descrizione: Effettua il logout dell'utente.
   - Autenticazione: Richiesta.

2. **GET /profile**
   
   - Descrizione: Visualizza le info di profilo dell'utente.
   - Autenticazione: Richiesta.

3. **GET /projects**
   
   - Descrizione: Visualizza tutti i progetti.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.

4. **GET /projects/**
   
   - Descrizione: Visualizza i dettagli di un singolo progetto.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.

5. **POST /projects/create**
   
   - Descrizione: Crea un nuovo progetto.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.

6. **POST /projects/**
   
   **/add-member**
   
   - Descrizione: Aggiunge un membro a un progetto esistente.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.
   
   **/upload-document**
   
   - Descrizione: Carica un file come documento del progetto, <u>dimensione massima 30 MB, formato JPEG/PNG/PDF</u>.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.

   **/generate-pdf**
   
   - Descrizione: Genera un PDF con le informazioni del progetto.
   - Autenticazione: Richiesta con ruolo <b>admin</b>.

## ❗VULNERABILITA'❗

### 1. Server-Side Request Forgery (SSRF) nella Generazione di PDF

La <b>generazione del PDF</b> include contenuti HTML che possono includere iframe con URL esterni o interni. Un esempio di come sfruttare questa vulnerabilità è inserire un iframe che punti a file locali come `/etc/passwd`.

**Esempio di Payload Maligno:**

```html
<iframe src="file:///etc/passwd"></iframe>
```

### 2. Cross-Site Scripting (XSS)

La piattaforma permette di inserire contenuti HTML nei progetti senza una valida sanificazione, permettendo così l'inserimento di script maligni. Gli script verranno eseguiti nella creazione del PDF. Questo perchè la libreria <i>puppeteer</i> genera il PDF da una pagina web aperta in modo invisibile in background, eseguendo quindi eventuali script inseriti malevolmente.

**Esempio di Payload Maligno:**

```html
<script>...</script>
```

### 3. Utilizzo di JWT con chiavi segrete deboli

Il sistema di autenticazione utilizza JSON Web Tokens (JWT) con una chiave segreta debole, rendendo possibile per un attaccante effettuare un brute-force sulla chiave segreta.

### 4. Accesso a File con Path Traversal
Quando l'applicazione permette di accedere ai file di sistema tramite input controllato dall'utente, come un iframe che carica file specificati da un campo di input, questa è una chiara violazione di sicurezza che può essere sfruttata con tecniche di path traversal.

**Esempio di Payload Maligno:**
```html
<iframe src="file:/../../../../etc/passwd"></iframe>
```

In questo esempio, l'attaccante manipola il parametro file per accedere a /etc/passwd, un file che non dovrebbe essere accessibile tramite l'applicazione web.

### 5. Da trovare...

La No-SQL injection dovrebbe essere mitigata dall'apposita libreria, gli input (tranne il campo Descrizione nella creazione del proegetto che è stato volutamente lasciato non sanificato) sono tutti sanificati. Anche il caricamento del file è stato implementato con i controlli del caso per evitare vulnerabilità. Il sito quindi dovrebbe essere sicuro tranne per i casi esposti in precedenza, tuttavia non sono da escludere vulnerabilità non note 🙂

## Configurazione e Avvio del Progetto

### Prerequisiti

- Node.js
- MongoDB

### Istruzioni di Avvio

1. Clona il repository:
   
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Installa le dipendenze:
   
   ```sh
   npm install
   ```

3. Avvia MongoDB:
   
   ```sh
   mongod
   ```

4. Configura il database nel file .env, la JWT_SECRET va modificata nel codice (è quella la vulnerabilità principale quindi è stato deciso di renderla non modificabile esternamente)
   
   ```tsconfig
   DB_HOST=localhost
   DB_PORT=27017
   DB_NAME=projecter
   ```
5. Per collegarsi da un host esternamente è consigliato creare un certificato HTTPS tramite OpenSSL, dato che i browser ormai forzano l'utilizzo di tale protocollo. Nel caso di creazione di una macchina virtuale è meglio configurare Nginx. Il progetto così com'è scritto non supporta di default HTTPS, vanno decommentate alcune righe su app.js.

   ```sh
   openssl genrsa -out key.pem
   openssl req -new -key key.pem -out csr.pem
   openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
   ```

6. Avvia l'applicazione:
   
   ```sh
   node app.js
   ```

6. Apri il browser e vai a `http://localhost:3000`.

## ‼️ Note sulla Sicurezza ‼️

Questa applicazione è stata progettata per scopi didattici e contiene intenzionalmente delle vulnerabilità. Non deve essere utilizzata in ambienti di produzione. Le vulnerabilità includono SSRF, XSS e JWT con chiavi deboli. È importante utilizzare tecniche di mitigazione come:

- Sanificazione delle input per prevenire XSS.
- Validazione degli URL per prevenire SSRF.
- Utilizzo di chiavi segrete robuste per JWT.

## Toolbox

1. **Node.js**: Utilizzato come runtime per eseguire JavaScript sul server. [Scopri di più](https://nodejs.org/)
2. **Express**: Framework web minimalista per Node.js che facilita la creazione di applicazioni web e API. [Scopri di più](https://expressjs.com/)
3. **MongoDB**: Database NoSQL scalabile e flessibile utilizzato per la gestione dei dati. [Scopri di più](https://www.mongodb.com/)
4. **Mongoose**: Libreria di modellazione per MongoDB, che fornisce un'interfaccia intuitiva per la gestione dei dati. [Scopri di più](https://mongoosejs.com/)
5. **EJS**: Motore di template che permette di generare HTML dinamico con JavaScript. [Scopri di più](https://ejs.co/)
6. **Bootstrap**: Framework CSS per sviluppare rapidamente design responsive e moderni. [Scopri di più](https://getbootstrap.com/)
7. **Puppeteer**: Libreria che fornisce un'API di alto livello per controllare il browser Chrome/Chromium tramite il protocollo DevTools, utilizzato in questo caso per generare il PDF. [Scopri di più](https://pptr.dev/)
8. **XSS**: Libreria per sanificare input e prevenire attacchi XSS (Cross-Site Scripting). [Scopri di più](https://github.com/leizongmin/js-xss)
9. **Express Mongo Sanitize**: Middleware per prevenire attacchi di iniezione NoSQL eliminando caratteri dannosi dalle query MongoDB. [Scopri di più](https://www.npmjs.com/package/express-mongo-sanitize)
10. **dotenv**: Carica variabili di ambiente da un file `.env` per mantenere le configurazioni separate dal codice. [Scopri di più](https://github.com/motdotla/dotenv)
11. **Helmet**: Middleware per la sicurezza delle app Express, che aiuta a impostare intestazioni HTTP sicure. [Scopri di più](https://helmetjs.github.io/)
12. **JWT**: Standard per la creazione di token di accesso, utilizzato per autenticazione sicura. [Scopri di più](https://jwt.io/)