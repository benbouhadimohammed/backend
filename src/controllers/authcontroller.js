const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../models/usermodel");
const pool = require('../config/db');


const crypto = require('crypto'); // À ajouter en haut de ton fichier de contrôleur s'il n'y est pas déjà
const { sendValidationEmail } = require('../services/emailservice'); // Chemin vers ton service Brevo


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^(0)(5|6|7|9)\d{8}$/;


const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: "Champs requis" });
    }

   
    const user = await findUserByEmail(email); // Ta fonction existante
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

   
    if (user.is_verified) {
      return res.status(400).json({ message: "Ce compte est déjà validé" });
    }

    // 3. Vérifier la validité de l'OTP
    if (user.otp_code !== otpCode) {
      return res.status(400).json({ message: "Code OTP incorrect" });
    }

    // 4. Vérifier si le code a expiré
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ message: "Le code OTP a expiré. Veuillez en demander un nouveau." });
    }

    await pool.query(
      `UPDATE users 
       SET is_verified = true, otp_code = NULL, otp_expires = NULL 
       WHERE id_user = $1`,
      [user.id_user]
    );


    res.json({ message: "Votre compte a été validé avec succès ! Vous pouvez maintenant vous connecter." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const register = async (req, res) => {
  try {
    const { nom, email, password, numero, type_user } = req.body;

    // 1. Validations de champs existantes
    if (!nom || !email || !password || !numero || !type_user) {
      return res.status(400).json({ message: "All fields required" });
    }
    if (nom.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, include uppercase, lowercase and a number",
      });
    }
    if (!PHONE_REGEX.test(numero)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Chiffrement du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 🆕 Génération du code OTP à 6 chiffres et sa date d'expiration (15 minutes)
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); 

    // 4. 🆕 Création de l'utilisateur avec ses jetons OTP et statut non vérifié
    // Note : Pense à bien ajouter les colonnes otp_code, otp_expires et is_verified (valeur par défaut : false) dans ton usermodel/BDD.
    const user = await createUser(
      nom, 
      email, 
      numero, 
      type_user, 
      hashedPassword,
      otpCode,
      otpExpires
    );

    // 5. 🆕 Expédition immédiate du mail de validation en arrière-plan via Brevo
    await sendValidationEmail(email, nom, otpCode);

    // 6. Réponse modifiée pour indiquer l'attente de validation
    res.status(201).json({
      message: "Utilisateur enregistré. Un code OTP de validation vous a été envoyé par e-mail.",
      email, // Utile au frontend pour savoir sur quel mail envoyer la confirmation OTP
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

   
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
     if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

   
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    if (user.is_verified === false) {
      return res.status(403).json({ 
        message: "Votre compte n'est pas encore activé. Veuillez vérifier vos e-mails pour entrer le code OTP." 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

  

    
    const token = jwt.sign(
      { id: user.id_user, email: user.email, role: user.role, type_user: user.type_user },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      
      user: { id: user.id_user, nom: user.nom, email: user.email, role: user.role  },
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};



module.exports = { register, login, verifyOTP};

