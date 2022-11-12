const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const sauceRoutes = require('./routes/sauces');
const userRoutes = require('./routes/user');
const path = require('path');

const helmet = require('helmet');
const nocache = require('nocache');

const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit')

//dotenv masque les informations de connexion à la base de données
dotenv.config();

//Connexion à la base de données
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));

//Création de l'app express
const app = express();

// rateLimit empêche les attaques brute force (trop de requetes provenant de la même adresse IP)
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false,
})

// Débloquer certaines sécurité CORS, en têtes utilisés, autorisation méthodes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});


// Extraction objet JSON pour gérer les POST
app.use(bodyParser.json());


//Sécurise l'application (en têtes, requetes HTTP, controle de DNS, protection XSS...)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(limiter)
//Désactive la mise en cache du navigateur
app.use(nocache());
//Routes :
app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;