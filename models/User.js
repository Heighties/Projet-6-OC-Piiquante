const mongoose = require('mongoose');
require('mongoose-type-email');
const uniqueValidator = require('mongoose-unique-validator');
const sanitizerPlugin = require('mongoose-sanitizer-plugin');

// Schéma mongoose utilisateur
const userSchema = mongoose.Schema({
  email: { type: String, required: [true, "Veuillez entrer votre adresse email"], unique: true, 
  match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Veuillez entrer une adresse email correcte"] },
  password: { type: String, required: [true, "Veuillez entrer un mot de passe"] }
});

userSchema.plugin(uniqueValidator);

userSchema.plugin(sanitizerPlugin);

module.exports = mongoose.model('User', userSchema);