require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const JWT= process.env.JWT_SECRET;
const pool = require("./config/db");
const authroutes = require("./routes/authroutes");
const adminroutes = require("./routes/adminroutes");
const annonceroutes = require("./routes/annonceroutes");
const userroutes = require("./routes/userroutes");
const forumroutes = require("./routes/forumRoutes");
const favorisroutes = require("./routes/favorisroutes");
const path = require('path')
const messageRoutes = require('./routes/messageroutes')

// Après app.use(express.json())

app.use(cors({
  origin: 'http://localhost:5173', // ← port de ton frontend
  credentials: true,
}));


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))


app.use("/api/auth", authroutes);
app.use("/api/admin", adminroutes);
app.use("/api/annonces", annonceroutes);
app.use("/api/users", userroutes);
app.use("/api/forum", forumroutes);
app.use("/api/favoris", favorisroutes);
app.use('/api/messages', messageRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

