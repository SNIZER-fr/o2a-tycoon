const express = require("express");
const path = require("path");
const app = express();

// Sert tous les fichiers statiques du dossier courant (HTML, CSS, JS, images, etc.)
app.use(express.static(__dirname));

// Route principale -> redirige vers index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Render fournit son propre port (process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍟 O2A Tycoon lancé sur le port ${PORT}`);
});
