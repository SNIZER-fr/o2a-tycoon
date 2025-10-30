document.addEventListener("DOMContentLoaded", () => {

  // === VARIABLES GLOBALES ===
  let saveData = JSON.parse(localStorage.getItem('saveData')) || {
    money: 0,
    satisfaction: 100,
    items: []
  };
  let money = saveData.money;
  let satisfaction = saveData.satisfaction;
  let patienceSpeed = 200;
  let clientSpawnRate = 1.0; // 1 = normal, plus petit = plus rapide
  let gainBonus = 0;
  let comboCount = 0;
  let lastServeTime = 0;
  let robotShouldStart = false;
  let robotCheckInterval;



  const moneyDisplay = document.getElementById('money');
  const satisfactionDisplay = document.getElementById('satisfaction');

  const sonCuisson = document.getElementById('son-cuisson');
  const sonJoie = document.getElementById('son-joie');
  const sonRale = document.getElementById('son-rale');

  // === BOUTON RETOUR AU MENU ===
  document.getElementById('backMenu').onclick = () => {
    window.location.href = "index.html";
  };
// === BOUTON ACTUALISER ===
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    refreshBtn.textContent = "⏳ Actualisation...";
    refreshBtn.disabled = true;

    // petit délai avant reload pour effet visuel
    setTimeout(() => {
      window.location.reload();
    }, 700);
  });
}

  // === ÉQUIPEMENTS ===
  let items = [
  { 
    name: "Friteuse Pro", 
    price: 50, 
    effect: "speed", 
    value: -20, 
    bought: false, 
    description: "🔥 Diminue le temps d’attente des clients (service +20%)"
  },
  { 
    name: "Plancha Pro", 
    price: 75, 
    effect: "speed", 
    value: -20, 
    bought: false, 
    description: "🍖 Réduit encore le temps d’attente des clients (service +20%)"
  },
  { 
    name: "Caisse Pro", 
    price: 100, 
    effect: "bonus", 
    value: 2, 
    bought: false, 
    description: "💰 Chaque commande rapporte +2 € supplémentaires"
  },
  { 
    name: "Vitrine Pro", 
    price: 125, 
    effect: "satisfaction", 
    value: 10, 
    bought: false, 
    description: "🧊 Clients plus satisfaits et arrivent 10 % plus vite"
  },
  { 
    name: "Nouvelle Caisse", 
    price: 150, 
    effect: "multiline", 
    value: 1, 
    bought: false, 
    description: "🧾 Ajoute une deuxième file de clients dans la friterie"
  },
  { name: "Robot Serveur O2A", 
    price: 200, 
    effect: "auto", 
    value: 1, 
    bought: false, 
    description: "🤖 Consommable : active un robot pendant la journée (à racheter après chaque session)" }

];
// === STOCK INITIAL ===
let stock = JSON.parse(localStorage.getItem('stockData')) || {
  pain: 20,
  steak: 20,
  frites: 30,
  sauce: 40
};


  // === HISTORIQUES ===
  let journalData = JSON.parse(localStorage.getItem('journalData')) || [];
  let accountData = JSON.parse(localStorage.getItem('accountData')) || {
    totalSales: 0,
    totalExpenses: 0,
    profitHistory: []
  };

  // === SAUVEGARDE ===
  function saveGame() {
    saveData.money = money;
    saveData.satisfaction = satisfaction;
    saveData.items = items.filter(i => i.bought).map(i => i.name);
    localStorage.setItem('saveData', JSON.stringify(saveData));
  }
  function saveStock() {
    localStorage.setItem('stockData', JSON.stringify(stock));
  }
  function addJournal(text) {
    const entry = { text, date: new Date().toLocaleTimeString() };
    journalData.push(entry);
    if (journalData.length > 25) journalData.shift();
    localStorage.setItem('journalData', JSON.stringify(journalData));
  }

  // === APPLICATION DES BONUS ÉQUIPEMENTS ===
  if (saveData.items.length > 0) {
    saveData.items.forEach(name => {
      const item = items.find(i => i.name === name);
      if (item) {
        item.bought = true;
        applyItemEffect(item);
      }
    });
  }
  function applyItemEffect(item) {
  switch (item.effect) {
    case "speed":
      patienceSpeed += item.value;
      if (patienceSpeed < 50) patienceSpeed = 50;
      addJournal(`⚡ Service accéléré grâce à ${item.name}`);
      break;

    case "bonus":
      gainBonus += item.value;
      addJournal(`💰 Les ventes rapportent ${gainBonus} € de plus`);
      break;

    case "satisfaction":
      satisfaction += item.value;
      satisfactionDisplay.textContent = satisfaction;
      addJournal(`😊 Satisfaction client améliorée (+${item.value}%)`);
      // Clients arrivent plus vite
      clientSpawnRate *= 0.9;
      break;

    case "multiline":
  addJournal("🧾 Nouvelle Caisse installée : une deuxième file de clients disponible !");
  saveGame();
  // 👇 relance directement l’affichage des clients
  setTimeout(() => newClient(), 500);
  break;


    case "auto":
  enableRobotServer();
  addJournal("🤖 Robot Serveur O2A engagé pour la journée !");
  // Le robot se désactivera automatiquement après 10 minutes
  setTimeout(() => {
    clearInterval(robotInterval);
    document.getElementById("toggleRobotBtn").classList.remove("hidden");
    addJournal("🕓 Fin de service du Robot Serveur O2A. Pensez à le racheter demain !");
  }, 600000);
  break;
  }

}


  // === MAGASIN ===
  const shopBtn = document.getElementById('shopBtn');
  const shop = document.getElementById('shop');
  const itemsDiv = document.getElementById('items');
  const closeShop = document.getElementById('closeShop');

  shopBtn.onclick = () => {
    shop.classList.remove('hidden');
    renderShop();
  };
  closeShop.onclick = () => shop.classList.add('hidden');

  function renderShop() {
  itemsDiv.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';

    const btn = document.createElement('button');
    btn.textContent = `${item.name} - ${item.price}€ ${item.bought ? '✅' : ''}`;
    btn.disabled = item.bought;
    btn.onclick = () => buyItem(item);

    const desc = document.createElement('p');
    desc.textContent = item.description;
    desc.style.fontSize = "13px";
    desc.style.margin = "4px 0 10px";
    desc.style.color = "#ccc";

    div.appendChild(btn);
    div.appendChild(desc);
    itemsDiv.appendChild(div);
  });
}


  function buyItem(item) {
  const index = items.indexOf(item);

  // Vérifie si l'amélioration précédente est achetée
  if (index > 0 && !items[index - 1].bought) {
    alert(`🛑 Vous devez d'abord acheter "${items[index - 1].name}" avant "${item.name}"`);
    return;
  }

  if (money < item.price || item.bought) return;
  money -= item.price;
  item.bought = true;
  moneyDisplay.textContent = money;
  applyItemEffect(item);
  sonJoie.play();
  renderShop();
  saveGame();
  addJournal(`Achat : ${item.name} - ${item.price}€`);
}


  // === STOCK ===
  const stockBtn = document.getElementById('stockBtn');
  const stockDiv = document.getElementById('stock');
  const stockItems = document.getElementById('stockItems');
  const closeStock = document.getElementById('closeStock');

  stockBtn.onclick = () => {
    stockDiv.classList.remove('hidden');
    renderStock();
  };
  closeStock.onclick = () => stockDiv.classList.add('hidden');

  function renderStock() {
    stockItems.innerHTML = '';
    Object.entries(stock).forEach(([name, qty]) => {
      const prices = { pain: 1, steak: 2, frites: 1, sauce: 0.5 };
      const div = document.createElement('div');
      const btnBuy = document.createElement('button');
      btnBuy.textContent = `Acheter 10 ${name} (×${prices[name]}€)`;
      btnBuy.onclick = () => buyStock(name, prices[name]);
      div.textContent = `${name} : ${qty}`;
      div.appendChild(document.createElement('br'));
      div.appendChild(btnBuy);
      stockItems.appendChild(div);
      // Met à jour aussi la barre du haut
document.getElementById('stockPain').textContent = stock.pain;
document.getElementById('stockSteak').textContent = stock.steak;
document.getElementById('stockFrites').textContent = stock.frites;
document.getElementById('stockSauce').textContent = stock.sauce;

    });
  }

  function buyStock(name, price) {
    const cost = price * 10;
    if (money < cost) return alert("Pas assez d’argent !");
    money -= cost;
    stock[name] += 10;
    saveGame();
    localStorage.setItem('items', JSON.stringify(items));
    saveStock();
    renderStock();
    moneyDisplay.textContent = money;
    addExpense(cost);
    addJournal(`Achat de stock : ${name} (+10) -${cost}€`);
  }

  function checkStock() {
    const needed = { pain: 1, steak: 1, frites: 1, sauce: 1 };
    for (const ing in needed) {
      if (stock[ing] < needed[ing]) return false;
    }
    return true;
  }
  function useStock() {
    const needed = { pain: 1, steak: 1, frites: 1, sauce: 1 };
    for (const ing in needed) {
      stock[ing] -= needed[ing];
      if (stock[ing] < 0) stock[ing] = 0;
    }
    autoRestock();
    saveStock();
    document.getElementById('stockPain').textContent = stock.pain;
document.getElementById('stockSteak').textContent = stock.steak;
document.getElementById('stockFrites').textContent = stock.frites;
document.getElementById('stockSauce').textContent = stock.sauce;

  }
// === AUTO-COMMANDE STOCK ===
function autoRestock() {
  const restockThreshold = 3; // seuil de réapprovisionnement
  const restockAmount = 10;   // quantité à racheter
  const unitPrice = 2;        // prix moyen par unité

  for (let item in stock) {
    if (stock[item] <= restockThreshold) {
      const cost = restockAmount * unitPrice;
      if (money >= cost) {
        stock[item] += restockAmount;
        money -= cost;
        moneyDisplay.textContent = money;
        addJournal(`🤖 Auto-commande : +${restockAmount} ${item}(s) pour ${cost}€`);
        saveStock();
        saveGame();
      } else {
        addJournal(`⚠️ Auto-commande échouée : pas assez d'argent pour ${item}`);
      }
    }
  }
}

  // === FOURNISSEUR ===
  const supplierBtn = document.getElementById('supplierBtn');
  const supplierDiv = document.getElementById('supplier');
  const supplierItemsDiv = document.getElementById('supplierItems');
  const supplierStatus = document.getElementById('supplierStatus');
  const closeSupplier = document.getElementById('closeSupplier');
  const truck = document.getElementById('truck');

  supplierBtn.onclick = () => {
    supplierDiv.classList.remove('hidden');
    renderSupplier();
  };
  closeSupplier.onclick = () => supplierDiv.classList.add('hidden');

  function renderSupplier() {
    supplierItemsDiv.innerHTML = '';
    const prices = { pain: 1, steak: 2, frites: 1, sauce: 0.5 };
    Object.entries(prices).forEach(([name, basePrice]) => {
      const price = (basePrice * (0.8 + Math.random() * 0.4)).toFixed(2);
      const btn = document.createElement('button');
      btn.textContent = `Acheter 20 ${name} - ${price}€/u`;
      btn.onclick = () => orderFromSupplier(name, parseFloat(price));
      supplierItemsDiv.appendChild(btn);
    });
  }

  function orderFromSupplier(item, price) {
    const cost = price * 20;
    if (money < cost) return alert("Pas assez d'argent !");
    money -= cost;
    moneyDisplay.textContent = money;
    supplierStatus.textContent = "🚚 Livraison en cours...";
    addExpense(cost);
    addJournal(`Commande fournisseur : ${item} (20u) -${cost}€`);

    truck.classList.remove('hidden');
    truck.classList.add('show');

    setTimeout(() => {
      truck.classList.remove('show');
      setTimeout(() => truck.classList.add('hidden'), 1000);
      stock[item] += 20;
      saveStock();
      supplierStatus.textContent = `✅ Livraison reçue : ${item} (+20)`;
      addJournal(`Livraison reçue : ${item} (+20)`);
      sonJoie.play();
    }, 4000);
  }

  // === JOURNAL ===
  const journalBtn = document.getElementById('journalBtn');
  const journalDiv = document.getElementById('journal');
  const closeJournal = document.getElementById('closeJournal');
  const journalEntries = document.getElementById('journalEntries');

  journalBtn.onclick = () => {
    renderJournal();
    journalDiv.classList.remove('hidden');
  };
  closeJournal.onclick = () => journalDiv.classList.add('hidden');

  function renderJournal() {
    journalEntries.innerHTML = '';
    journalData.slice().reverse().forEach(entry => {
      const div = document.createElement('div');
      div.textContent = `[${entry.date}] ${entry.text}`;
      journalEntries.appendChild(div);
    });
  }

  // === TABLEAU DE BORD ===
  const dashboardBtn = document.getElementById('dashboardBtn');
  const dashboardDiv = document.getElementById('dashboard');
  const dashboardStats = document.getElementById('dashboardStats');
  const closeDashboard = document.getElementById('closeDashboard');
  const profitCanvas = document.getElementById('profitChart');
  const ctx = profitCanvas ? profitCanvas.getContext('2d') : null;

  dashboardBtn.onclick = () => {
    renderDashboard();
    dashboardDiv.classList.remove('hidden');
  };
  closeDashboard.onclick = () => dashboardDiv.classList.add('hidden');

  function renderDashboard() {
    const profit = accountData.totalSales - accountData.totalExpenses;
    dashboardStats.innerHTML = `
      💶 <b>Ventes :</b> ${accountData.totalSales.toFixed(2)}€<br>
      💸 <b>Dépenses :</b> ${accountData.totalExpenses.toFixed(2)}€<br>
      📈 <b>Bénéfice :</b> ${profit.toFixed(2)}€<br>
    `;
    drawProfitChart();
  }

  function drawProfitChart() {
    if (!ctx) return;
    const data = accountData.profitHistory.slice(-20);
    ctx.clearRect(0, 0, 300, 150);
    if (data.length < 2) {
      ctx.fillStyle = "#999";
      ctx.font = "14px Arial";
      ctx.fillText("Pas encore de données", 60, 75);
      return;
    }
    const maxVal = Math.max(...data);
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * 300;
      const y = 150 - (val / maxVal) * 140;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#ff66cc";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function addSale(amount) {
    accountData.totalSales += amount;
    updateProfit();
  }
  function addExpense(amount) {
    accountData.totalExpenses += amount;
    updateProfit();
  }
  function updateProfit() {
    const profit = accountData.totalSales - accountData.totalExpenses;
    accountData.profitHistory.push(profit);
    localStorage.setItem("accountData", JSON.stringify(accountData));
  }
// === CALCUL DU NOMBRE DE LIGNES ACTIVES ===
function getActiveLines() {
  const multi = items.find(i => i.effect === "multiline" && i.bought);
  return multi ? 2 : 1;
}


  // === CLIENT ===
  // === CLIENTS MULTI-LIGNES ===
function newClient() {
  const zone = document.getElementById('clientZones');
  zone.innerHTML = '';

  const activeLines = getActiveLines();

  for (let i = 1; i <= activeLines; i++) {
    createClientLine(i);
  }

  // Message spécial si 2 lignes sont débloquées
  if (activeLines === 2 && !localStorage.getItem("multiUnlocked")) {
    addJournal("🎉 Nouvelle file de clients débloquée ! La friterie devient plus rapide !");
    localStorage.setItem("multiUnlocked", "true");
    const msg = document.createElement("div");
    msg.textContent = "🎉 Nouvelle file débloquée ! Vous servez deux clients à la fois !";
    msg.style.background = "rgba(255,255,255,0.1)";
    msg.style.padding = "10px";
    msg.style.borderRadius = "10px";
    msg.style.textAlign = "center";
    msg.style.margin = "10px auto";
    msg.style.color = "lime";
    zone.appendChild(msg);
    setTimeout(() => msg.remove(), 5000);
  }
}

function createClientLine(lineId) {
  let patience = 100;
  let waiting = true;

  // Si la ligne existe déjà → on la vide et on la réutilise
  let div = document.getElementById(`line${lineId}`);
  if (!div) {
    div = document.createElement('div');
    div.id = `line${lineId}`;
    div.className = 'client-line';
    document.getElementById('clientZones').appendChild(div);
  }
  div.innerHTML = `
    <p id="client${lineId}">Client ${lineId} : en attente...</p>
    <div class="barre-patience"><div class="patience" id="patience${lineId}"></div></div>
    <button id="serve${lineId}">Servir ce client 🍔</button>
  `;

  const clientText = document.getElementById(`client${lineId}`);
  const patienceBar = document.getElementById(`patience${lineId}`);
  const serveButton = document.getElementById(`serve${lineId}`);

  const commandes = ["Burger + Frites", "Américain", "Cheeseburger", "Tacos", "Frites + Mayo"];
  const random = commandes[Math.floor(Math.random() * commandes.length)];
  clientText.textContent = `Client ${lineId} : veut ${random}`;
// === AJOUT : ajustement de la vitesse selon la satisfaction ===
let adjustedSpeed = patienceSpeed;
if (satisfaction > 100) {
  // Bonus vitesse : +1% par tranche de 100 au-dessus
  adjustedSpeed = patienceSpeed * (1 - ((satisfaction - 100) / 10000));
} else if (satisfaction < 100) {
  // Pénalité vitesse : -1% par tranche de 100 en dessous
  adjustedSpeed = patienceSpeed * (1 + ((100 - satisfaction) / 10000));
}

  const timer = setInterval(() => {
    if (!waiting) return;
    patience -= 1;
    patienceBar.style.width = patience + "%";
    if (patience > 50) patienceBar.style.background = "limegreen";
    else if (patience > 20) patienceBar.style.background = "orange";
    else patienceBar.style.background = "red";

    if (patience <= 0) {
      clearInterval(timer);
      waiting = false;
      clientText.textContent = `Client ${lineId} parti 😡`;
      satisfaction -= 10;
      satisfactionDisplay.textContent = satisfaction;
      sonRale.play();
      saveGame();
      // relancer la même ligne après un petit délai
      setTimeout(() => createClientLine(lineId), 2000);
    }
  }, adjustedSpeed);


  serveButton.onclick = () => {
    if (!waiting) return;
    if (!checkStock()) {
      alert("🧂 Pas assez de stock !");
      return;
    }
    waiting = false;
    clearInterval(timer);
    useStock();
    const gain = Math.floor(Math.random() * 5) + 3 + gainBonus;
    const bonus = Math.floor(patience / 20);
    const total = gain + bonus;
    money += total;
    addSale(total);
    moneyDisplay.textContent = money;
    clientText.textContent = `Client ${lineId} servi ! +${total}€`;
    sonCuisson.play();
    sonJoie.play();
    // === AJOUT : satisfaction gagnee par vente ===
    satisfaction += 10;
    if (satisfaction > 200) satisfaction = 200;
    satisfactionDisplay.textContent = satisfaction;

    saveGame();
    saveStock();
    addJournal(`Vente ligne ${lineId} : +${total}€`);

    if (lineId === 2 && robotActive) {
      const emoji = document.createElement('span');
      emoji.textContent = " 🤖💨";
      clientText.appendChild(emoji);
    }
      // === BONUS DE VITESSE ===
    const now = Date.now();
    if (lastServeTime && now - lastServeTime < 2000) { // moins de 2s
  comboCount++;
    } else {
  comboCount = 1; // reset si trop lent
    }
  lastServeTime = now;

  if (comboCount >= 10) {
  const bonusGain = 15;
  money += bonusGain;
  addSale(bonusGain);
  moneyDisplay.textContent = money;
  sonJoie.play();
  addJournal(`💥 Bonus rapidité : +${bonusGain}€ (10 services rapides consécutifs !)`);
  comboCount = 0; // reset combo
 }
    if (satisfaction < 0) satisfaction = 0;
if (satisfaction > 200) satisfaction = 200;
satisfactionDisplay.textContent = satisfaction;

    setTimeout(() => createClientLine(lineId), 2000);
  };

  // ✅ Si le robot est actif et qu'on est sur la ligne 2, il sert automatiquement
  if (robotActive && lineId === 2) {
    robotServeLine(2);
  }
}

// === ROBOT SERVEUR 🤖 ===
let robotActive = false;

function enableRobotServer() {
  console.log("🤖 Activation du robot en cours...");
  if (robotActive) return;
  robotActive = true;
  addJournal("🤖 Robot Serveur O2A activé ! Il gère maintenant toutes les files !");
  sonJoie.play();

  setTimeout(() => {
    robotServeLine();
  }, 1000);
}




function robotServeLine() {
  clearInterval(window.robotInterval);

  if (!robotActive) return;

  // ⚙️ Vérifie toutes les lignes existantes (1 et 2)
  window.robotInterval = setInterval(() => {
    for (let i = 1; i <= 2; i++) {
      const serveButton = document.getElementById(`serve${i}`);
      if (serveButton && serveButton.textContent.includes("Servir")) {
        serveButton.click();
      }
    }
  }, 1500); // toutes les 1,5 s
}

// === RÉINITIALISATION ÉVÉNEMENTS AU CHARGEMENT ===
document.getElementById('shopBtn').onclick = () => {
  document.getElementById('shop').classList.remove('hidden');
  renderShop();
};
document.getElementById('stockBtn').onclick = () => {
  document.getElementById('stock').classList.remove('hidden');
  renderStock();
};
document.getElementById('supplierBtn').onclick = () => {
  document.getElementById('supplier').classList.remove('hidden');
  renderSupplier();
};
document.getElementById('journalBtn').onclick = () => {
  renderJournal();
  document.getElementById('journal').classList.remove('hidden');
};
document.getElementById('dashboardBtn').onclick = () => {
  renderDashboard();
  document.getElementById('dashboard').classList.remove('hidden');
};
// === RESTAURATION DE PARTIE ===
  function restoreGameState() {
  // Recharge les achats sauvegardés
  const savedItems = JSON.parse(localStorage.getItem('items'));
  if (Array.isArray(savedData.items)) {
  savedData.items.forEach(name => {
    const item = items.find(i => i.name === name);
    if (item) {
      item.bought = true;
      applyItemEffect(item);
      if (item.name === "Robot Serveur O2A") {
        robotShouldStart = true; // on retient qu'il faut le relancer
      }
      if (items.find(i => i.name === "Robot Serveur O2A" && i.bought)) 
      {
  document.getElementById("toggleRobotBtn").classList.remove("hidden");
      }
        // Le robot doit toujours être racheté à chaque nouvelle session
    const robot = items.find(i => i.name === "Robot Serveur O2A");
    if (robot) robot.bought = false;

    }
  });
}




  // Recharge le stock
  const savedStock = JSON.parse(localStorage.getItem('stockData'));
  if (savedStock) stock = savedStock;

  // Recharge les valeurs de base
  const savedMoney = parseFloat(localStorage.getItem('money'));
  if (!isNaN(savedMoney)) money = savedMoney;

  const savedSatisfaction = parseFloat(localStorage.getItem('satisfaction'));
  if (!isNaN(savedSatisfaction)) satisfaction = savedSatisfaction;

  moneyDisplay.textContent = money;
  satisfactionDisplay.textContent = satisfaction;

  addJournal("🧑‍🍳 Friterie O2A prête ! Reprise automatique de la dernière session.");
}
// === BOUTON D'ACTIVATION / DÉSACTIVATION DU ROBOT ===


const toggleBtn = document.getElementById('toggleRobotBtn');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    if (!items.find(i => i.name === "Robot Serveur O2A" && i.bought)) {
      addJournal("❌ Vous n'avez pas encore acheté le Robot Serveur O2A !");
      return;
    }

    if (!robotActive) {
      enableRobotServer();
      toggleBtn.textContent = "🛑 Désactiver le robot";
      addJournal("🤖 Robot Serveur O2A activé manuellement !");
      robotActive = true;
    } else {
      clearInterval(robotInterval);
      toggleBtn.textContent = "🤖 Activer le robot";
      addJournal("🛑 Robot Serveur O2A désactivé !");
      robotActive = false;
    }
  });
}

// === DÉMARRAGE ===
restoreGameState();
autoRestock();

setTimeout(() => {
  newClient();

  // Vérification automatique toutes les secondes tant que le robot n'est pas relancé
  robotCheckInterval = setInterval(() => {
    if (robotShouldStart && document.getElementById('serve1')) {
      enableRobotServer();
      addJournal("🤖 Robot Serveur O2A réactivé automatiquement après reprise !");
      clearInterval(robotCheckInterval);
      robotShouldStart = false;
    }
  }, 1000);
}, 500);
// === SYSTÈME DE PRÊT ET FAILLITE ===
let hasTakenLoan = JSON.parse(localStorage.getItem("hasTakenLoan")) || false;

function checkMoneyStatus() {
  if (money <= 0) {
    if (!hasTakenLoan) {
      if (confirm("💸 Vous êtes à court d’argent ! Voulez-vous contracter un prêt de 100€ ? (Une seule fois)")) {
        money += 100;
        hasTakenLoan = true;
        localStorage.setItem("hasTakenLoan", true);
        addJournal("🏦 Prêt bancaire accordé : +100€");
        moneyDisplay.textContent = money;
        saveGame();
      } else {
        gameOver();
      }
    } else {
      gameOver();
    }
  }
}

function gameOver() {
  alert("💀 GAME OVER : La friterie O2A a fait faillite !");
  addJournal("💀 Faillite ! La friterie O2A ferme ses portes...");
  localStorage.clear();
  window.location.href = "index.html";
}

// Vérifie toutes les 3 secondes l’état des finances
setInterval(checkMoneyStatus, 3000);

}); // <== très important : cette accolade ferme ton document.addEventListener !