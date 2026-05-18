const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../models/usermodel");
const nodemailer = require("nodemailer");


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;





const register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    
    if (!nom || !email || !password) {
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

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
   
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await createUser(nom, email, hashedPassword);

    
   

    res.status(201).json({
      message: "User registered",
      
      user,
    });
  } catch (error) {
    console.error('Registration error:', error) 
    res.status(500).json({ message: error.message })
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



module.exports = { register, login};

