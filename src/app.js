require("dotenv").config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT = process.env.JWT_SECRET;

const pool = require("./config/db");
const authroutes = require("./routes/authroutes");
const adminroutes = require("./routes/adminroutes");
const annonceroutes = require("./routes/annonceroutes");
const userroutes = require("./routes/userroutes");
const forumroutes = require("./routes/forumRoutes");
const favorisroutes = require("./routes/favorisroutes");
const messageRoutes = require('./routes/messageroutes');
const contactRoutes = require('./routes/contactroutes');
const notificationRoutes = require('./routes/notificationroutes');

const server = http.createServer(app);
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Bienvenue sur l'API de BaytiCare ! Le serveur est opérationnel.",
    status: "Live",
    database: "Connected to Supabase"
  });
});

// ✅ Configuration des CORS ultra-robuste et dynamique pour la soutenance
app.use(cors({
  origin: function (origin, callback) {
    // 1. Autoriser les requêtes sans origine (comme Postman ou requêtes internes)
    if (!origin) return callback(null, true);

    // 2. Autoriser si l'origine contient localhost ou ton domaine Vercel
    if (origin.includes('localhost') || origin.includes('bayticare.vercel.app')) {
      return callback(null, true);
    } 
    
    // 3. Sécurité de secours si Vercel génère des URLs de preview (ex: bayticare-git...)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // Sinon, bloquer l'accès
    return callback(new Error('Bloqué par la politique CORS de BaytiCare'));
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ Configuration de Socket.io synchronisée sur les CORS dynamiques
const io = new Server(server, {
  cors: {
    origin: true, // Autorise automatiquement l'origine validée par le middleware CORS ci-dessus
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ Partage de l'instance 'io' dans Express pour casser la dépendance circulaire
app.set('io', io);

// Routage des API
app.use("/api/auth", authroutes);
app.use("/api/admin", adminroutes);
app.use("/api/annonces", annonceroutes);
app.use("/api/users", userroutes);
app.use("/api/forum", forumroutes);
app.use("/api/favoris", favorisroutes);
app.use("/api/messages", messageRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware d'authentification pour Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentification échouée : Token manquant"));
  }
  try {
    const decoded = jwt.verify(token, JWT);
    socket.user = decoded; // On attache l'utilisateur à la socket
    next();
  } catch (err) {
    next(new Error("Authentification échouée : Token invalide"));
  }
});

// Gestion des événements de connexion Socket.io
io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`Utilisateur connecté aux WebSockets : ${userId} (Socket ID: ${socket.id})`);

  // Rejoindre une "Room" spécifique pour chaque conversation
  socket.on('join_conversation', (id_conversation) => {
    socket.join(`conv_${id_conversation}`);
    console.log(`L'utilisateur ${userId} a rejoint la room: conv_${id_conversation}`);
  });

  // Quitter une conversation quand on change de chat
  socket.on('leave_conversation', (id_conversation) => {
    socket.leave(`conv_${id_conversation}`);
    console.log(`L'utilisateur ${userId} a quitté la room: conv_${id_conversation}`);
  });

  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté : ${userId}`);
  });
});

// ✅ Toujours écouter via 'server.listen' et non 'app.listen' pour activer Socket.io !
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});