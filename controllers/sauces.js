const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  // Stockage dans une const des données reçues du front sous forme de form-data -> transformation en objet js
    const sauceObject = JSON.parse(req.body.sauce);
    // Suppression de l'id renvoyé par le front end pour le remplacer par celui de la base de donnée MongoDB
    delete sauceObject._id;
    // delete sauceObject._userId;
    // Création d'une instance du modèle Sauce
    const sauce = new Sauce({
        ...sauceObject,
        // userId: req.auth.userId,
        // Modification de l'URL de l'image
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistrée !'})})
    .catch(error => { res.status(400).json( { error })})
};

exports.modifySauce = (req, res, next) => {
    let sauceObject = {};
    req.file ? (
      // Si la modification contient une image => Utilisation de l'opérateur ternaire comme structure conditionnelle.
      Sauce.findOne({
        _id: req.params.id
      }).then((sauce) => {
        // Supperssion de l'ancienne image du serveur
        const filename = sauce.imageUrl.split('/images/')[1]
        fs.unlinkSync(`images/${filename}`)
      }),
      sauceObject = {
        // Modification des données et ajout de la nouvelle image
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${
          req.file.filename
        }`,
      }
    ) : ( 
      sauceObject = {
        ...req.body
      }
    )
    Sauce.updateOne(
        // Application des paramètre de sauceObject
        {
          _id: req.params.id
        }, {
          ...sauceObject,
          _id: req.params.id
        }
      )
      .then(() => res.status(200).json({
        message: 'Sauce modifiée !'
      }))
      .catch((error) => res.status(400).json({
        error
      }))
  }

  exports.deleteSauce = (req, res, next) => {
    // Recherche de l'URL de l'image afin de supprimer le fichier avant suppression de l'objet
    Sauce.findOne({
        _id: req.params.id
      })
      .then(sauce => {
        // Pour extraire ce fichier, on récupère l'url de la sauce, et on le split autour de la chaine de caractères, donc le nom du fichier
        const filename = sauce.imageUrl.split('/images/')[1];
        // Avec ce nom de fichier, on appelle unlink pour suppr le fichier
        fs.unlink(`images/${filename}`, () => {
          // Suppression du document correspondant de la base de données
          Sauce.deleteOne({
              _id: req.params.id
            })
            .then(() => res.status(200).json({
              message: 'Sauce supprimée !'
            }))
            .catch(error => res.status(400).json({
              error
            }));
        });
      })
      .catch(error => res.status(500).json({
        error
      }));
  };

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
};

// Gestion des likes et dislikes
exports.likeDislike = (req, res, next) => {
    // Like actuel
    let like = req.body.like
    // Récupération de l'user ID
    let userId = req.body.userId
    // Récupération de l'id de la sauce
    let sauceId = req.params.id
  
    // Si utilisateur like
    if (like === 1) { 
      Sauce.updateOne({
          _id: sauceId
        }, {
          // On push l'utilisateur et on incrémente le compteur de 1
          $push: {
            usersLiked: userId
          },
          // On incrémente de 1
          $inc: {
            likes: +1
          }, 
        })
        .then(() => res.status(200).json({
          message: 'j\'aime ajouté !'
        }))
        .catch((error) => res.status(400).json({
          error
        }))
    }
    // Si utilisateur dislike
    if (like === -1) {
      Sauce.updateOne( 
          {
            _id: sauceId
          }, {
            $push: {
              usersDisliked: userId
            },
            // On incrémente de 1
            $inc: {
              dislikes: +1
            },
          }
        )
        .then(() => {
          res.status(200).json({
            message: 'Dislike ajouté !'
          })
        })
        .catch((error) => res.status(400).json({
          error
        }))
    }
    // Annulation d'un like ou dislike
    if (like === 0) { 
      Sauce.findOne({
          _id: sauceId
        })
        .then((sauce) => {
          // Si l'utilisateur annule son like
          if (sauce.usersLiked.includes(userId)) { 
            Sauce.updateOne({
                _id: sauceId
              }, {
                $pull: {
                  usersLiked: userId
                },
                // On incrémente de -1
                $inc: {
                  likes: -1
                },
              })
              .then(() => res.status(200).json({
                message: 'Like retiré !'
              }))
              .catch((error) => res.status(400).json({
                error
              }))
          }
          // Si l'utilisateur annule son dislike
          if (sauce.usersDisliked.includes(userId)) { 
            Sauce.updateOne({
                _id: sauceId
              }, {
                $pull: {
                  usersDisliked: userId
                },
                // On incrémente de -1
                $inc: {
                  dislikes: -1
                },
              })
              .then(() => res.status(200).json({
                message: 'Dislike retiré !'
              }))
              .catch((error) => res.status(400).json({
                error
              }))
          }
        })
        .catch((error) => res.status(404).json({
          error
        }))
    }
  }