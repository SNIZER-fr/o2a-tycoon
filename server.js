import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Sert les fichiers statiques (HTML, CSS, JS)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🚀 O2A Friterie Tycoon lancé sur http://localhost:${PORT}`);
});
