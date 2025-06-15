// Variabili globali
let players = {};  // Oggetto che conterrà i nomi dei giocatori e i loro punteggi (es. {mario: 104, luca: 208})
let currentRound = 0;  // Indica quale round stiamo giocando (da 1 a 7)
const totalRounds = 7;  // Numero totale di round

// Riferimenti al DOM → prendo elementi HTML da usare nel JS
const playerForm = document.getElementById("player-form");        // Il form per inserire i 4 nomi
const gameSection = document.getElementById("game-section");      // La sezione di gioco (inizialmente nascosta)
const roundTitle = document.getElementById("round-title");        // Titolo della mano corrente
const roundForm = document.getElementById("round-form");          // Il form per inserire i punteggi
const scoreList = document.getElementById("score-list");          // Lista visiva dei punteggi

// STEP 1: Quando l'utente preme "Avvia Partita"
playerForm.addEventListener("submit", function (event) {
  event.preventDefault();  // blocca il comportamento predefinito del form (cioè ricaricare la pagina)

  const inputs = playerForm.querySelectorAll("input[type='text']");  // prendo i 4 input dei nomi
  players = {};  // resetto l’oggetto

  inputs.forEach((input, index) => {
    const name = input.value.trim().toLowerCase();  // prendo il nome inserito, tolgo spazi e lo metto tutto minuscolo
    const fallback = `giocatore${index + 1}`;        // nome di backup se l’utente lascia il campo vuoto

    const finalName = name || fallback;
    if (players[finalName]) {
      players[`${finalName}_${index}`] = 0;  // se c’è già un nome uguale, aggiungo suffisso
    } else {
      players[finalName] = 0;
    }
  });

  // Nascondo il form iniziale e mostro la sezione di gioco
  document.getElementById("player-setup").style.display = "none";
  gameSection.style.display = "block";

  // Inizio il primo round
  startNextRound();
});

// STEP 2: Avvia un round
function startNextRound() {
  currentRound++;

  if (currentRound > totalRounds) {
    roundTitle.textContent = "Partita terminata! 🏁";
    roundForm.innerHTML = "";
    return;
  }

  // === MANO 5: MANI 8 E 13 ===
  if (currentRound === 5) {
    roundTitle.textContent = "Mano 5: Chi ha preso la mano 8 e la mano 13? (52 punti ciascuna)";
    roundForm.innerHTML = "";

    const label8 = document.createElement("label");
    label8.textContent = "Chi ha preso la mano 8:";
    const select8 = document.createElement("select");

    const label13 = document.createElement("label");
    label13.textContent = "Chi ha preso la mano 13:";
    const select13 = document.createElement("select");

    for (const player in players) {
      for (const select of [select8, select13]) {
        const option = document.createElement("option");
        option.value = player;
        option.textContent = capitalize(player);
        select.appendChild(option);
      }
    }

    roundForm.appendChild(label8);
    roundForm.appendChild(select8);
    roundForm.appendChild(label13);
    roundForm.appendChild(select13);

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Conferma Round";
    submitBtn.type = "submit";
    roundForm.appendChild(submitBtn);

    roundForm.onsubmit = function (e) {
      e.preventDefault();
      const oldScores = { ...players };

      players[select8.value] += 52;
      players[select13.value] += 52;

      const somma = Object.values(players).reduce((a, b) => a + b, 0);
      if (somma > 520) {
        alert("Errore: somma > 520. Riprova.");
        players = oldScores;
        updateScoreboard();
        startNextRound();
        return;
      }

      updateScoreboard();
      startNextRound();
    };

    updateScoreboard();
    return;
  }

  // === MANO 6: K DI CUORI ===
  if (currentRound === 6) {
    roundTitle.textContent = "Mano 6: Chi ha preso il K di cuori? (+104 punti)";
    roundForm.innerHTML = "";

    const label = document.createElement("label");
    label.textContent = "Giocatore:";
    const select = document.createElement("select");

    for (const player in players) {
      const option = document.createElement("option");
      option.value = player;
      option.textContent = capitalize(player);
      select.appendChild(option);
    }

    roundForm.appendChild(label);
    roundForm.appendChild(select);

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Conferma Round";
    submitBtn.type = "submit";
    roundForm.appendChild(submitBtn);

    roundForm.onsubmit = function (e) {
      e.preventDefault();
      const oldScores = { ...players };
      players[select.value] += 104;

      const somma = Object.values(players).reduce((a, b) => a + b, 0);
      if (somma > 624) {
        alert("Errore: somma > 624. Riprova.");
        players = oldScores;
        updateScoreboard();
        startNextRound();
        return;
      }

      updateScoreboard();
      startNextRound();
    };

    updateScoreboard();
    return;
  }

  // === MANO 7: PUNTEGGI EXTRA ===
  if (currentRound === 7) {
    roundTitle.textContent = "Mano 7: Inserisci punteggi extra finché la somma non raggiunge 1248";
    roundForm.innerHTML = "";

    const labelPlayer = document.createElement("label");
    labelPlayer.textContent = "Giocatore:";
    const selectPlayer = document.createElement("select");

    for (const player in players) {
      const option = document.createElement("option");
      option.value = player;
      option.textContent = capitalize(player);
      selectPlayer.appendChild(option);
    }

    roundForm.appendChild(labelPlayer);
    roundForm.appendChild(selectPlayer);

    const fields = [
      { label: "Prese (x8)", name: "prese", multiplier: 8 },
      { label: "Cuori (x8)", name: "cuori", multiplier: 8 },
      { label: "J/K (x13)", name: "jk", multiplier: 13 },
      { label: "Donne (x26)", name: "donne", multiplier: 26 },
      { label: "Mani 8/13 (x52)", name: "mani", multiplier: 52 },
    ];

    const inputs = {};

    for (const field of fields) {
      const lbl = document.createElement("label");
      lbl.textContent = field.label;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.name = field.name;
      roundForm.appendChild(lbl);
      roundForm.appendChild(inp);
      inputs[field.name] = inp;
    }

    // K di cuori checkbox
    const labelK = document.createElement("label");
    labelK.textContent = "Ha preso il K di cuori?";
    const checkK = document.createElement("input");
    checkK.type = "checkbox";
    checkK.name = "kcuori";
    roundForm.appendChild(labelK);
    roundForm.appendChild(checkK);

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Aggiungi punteggi";
    submitBtn.type = "submit";
    roundForm.appendChild(submitBtn);

    roundForm.onsubmit = function (e) {
      e.preventDefault();
      const oldScores = { ...players };
      const sel = selectPlayer.value;
      let total = 0;

      for (const field of fields) {
        const val = parseInt(inputs[field.name].value || "0");
        total += val * field.multiplier;
      }

      if (checkK.checked) {
        total += 104;
      }

      players[sel] += total;

      const somma = Object.values(players).reduce((a, b) => a + b, 0);
      if (somma > 1248) {
        alert("Errore: somma > 1248. Riprova.");
        players = oldScores;
        updateScoreboard();
        startNextRound();
        return;
      }

      updateScoreboard();

      if (somma === 1248) {
        alert("Obiettivo raggiunto! Fine partita.");
        roundTitle.textContent = "Punteggio finale raggiunto! 🏆";
        roundForm.innerHTML = "";
      }
    };

    updateScoreboard();
    return;
  }

  // === ROUND STANDARD: MANI 1–4 ===
  const roundData = getRoundData(currentRound);
  roundTitle.textContent = `Mano ${currentRound}: ${roundData.descrizione}`;
  roundForm.innerHTML = "";

  for (const player in players) {
    const label = document.createElement("label");
    label.textContent = `${capitalize(player)}:`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.name = player;
    roundForm.appendChild(label);
    roundForm.appendChild(input);
  }

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Conferma Round";
  submitBtn.type = "submit";
  roundForm.appendChild(submitBtn);

  roundForm.onsubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(roundForm);
    let roundSum = 0;
    const oldScores = { ...players };

    for (const [player, value] of formData.entries()) {
      const val = parseInt(value || "0"); // se vuoto → 0
      const delta = val * roundData.moltiplicatore;
      players[player] += delta;
      roundSum += delta;
    }

    if (roundSum > roundData.target) {
      alert(`Errore: somma ${roundSum} > target ${roundData.target}. Riprova.`);
      players = oldScores;
      updateScoreboard();
      startNextRound();
      return;
    }

    updateScoreboard();
    startNextRound();
  };

  updateScoreboard();
}

// STEP 3: Dati dei round
function getRoundData(round) {
  const data = {
    1: { moltiplicatore: 8, target: 104, descrizione: "PRESE x8" },
    2: { moltiplicatore: 8, target: 208, descrizione: "CUORI x8" },
    3: { moltiplicatore: 13, target: 312, descrizione: "K o J x13" },
    4: { moltiplicatore: 26, target: 416, descrizione: "DONNE x26" },
    5: { moltiplicatore: 52, target: 520, descrizione: "MANI 8/13" },
    6: { moltiplicatore: 104, target: 624, descrizione: "K DI CUORI" },
    7: { moltiplicatore: 1, target: 1248, descrizione: "EXTRA" },
  };
  return data[round];
}

// STEP 4: Mostra i punteggi
function updateScoreboard() {
  scoreList.innerHTML = "";
  for (const player in players) {
    const li = document.createElement("li");
    li.textContent = `${capitalize(player)}: ${players[player]} punti`;
    scoreList.appendChild(li);
  }
}

// Helper: prima lettera maiuscola
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
