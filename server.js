const express = require("express");
const path = require("path");
const app = express();

// Sert les fichiers statiques du dossier courant
app.use(express.static(path.join(__dirname)));

// === ROUTES ===

// Page d’accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Page de jeu
app.get("/game.html", (req, res) => {
  res.sendFile(path.join(__dirname, "game.html"));
});

// JS du jeu
app.get("/game.js", (req, res) => {
  res.sendFile(path.join(__dirname, "game.js"));
});

// CSS
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

// Route “catch-all” pour éviter les erreurs 404 sur Render
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Démarrage serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur O2A Tycoon actif sur le port ${PORT}`);
});
