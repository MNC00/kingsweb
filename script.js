// =============================
// SCRIPT PRINCIPALE
// Aggiunti commenti extra per maggiore chiarezza
// =============================

// Oggetto per memorizzare i punteggi dei giocatori
let players = {};
let currentRound = 0;
const totalRounds = 7;

// Recupero elementi dal DOM
const playerForm = document.getElementById("player-form");
const gameSection = document.getElementById("game-section");
const roundTitle = document.getElementById("round-title");
const roundForm = document.getElementById("round-form");
const scoreList = document.getElementById("score-list");

// Quando si avvia la partita
playerForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const inputs = playerForm.querySelectorAll("input[type='text']");
  players = {};

  inputs.forEach((input, index) => {
    const name = input.value.trim().toLowerCase();
    const fallback = `giocatore${index + 1}`;
    const finalName = name || fallback;

    if (players[finalName]) {
      players[`${finalName}_${index}`] = 0;
    } else {
      players[finalName] = 0;
    }
  });

  document.getElementById("player-setup").style.display = "none";
  gameSection.style.display = "block";
  startNextRound();
});

// Avvia il round successivo
function startNextRound() {
  currentRound++;

  if (currentRound > totalRounds) {
    roundTitle.textContent = "Partita terminata! 🏁";
    roundForm.innerHTML = "";
    return;
  }

  // Logica per round speciali
  if (currentRound === 5) {
    handleSpecialRound5();
    return;
  }
  if (currentRound === 6) {
    handleSpecialRound6();
    return;
  }
  if (currentRound === 7) {
    handleFinalRound();
    return;
  }

  // Round standard (1–4)
  const roundData = getRoundData(currentRound);
  roundTitle.textContent = `Round ${currentRound}: ${roundData.descrizione}`;
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
      const val = parseInt(value || "0");
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

// Dati dei round
function getRoundData(round) {
  const data = {
    1: { moltiplicatore: 8, target: 104, descrizione: "OGNI PRESA VALE 8" },
    2: { moltiplicatore: 8, target: 208, descrizione: "OGNI CUORE VALE 8" },
    3: { moltiplicatore: 13, target: 312, descrizione: "OGNI K O J VALE 13" },
    4: { moltiplicatore: 26, target: 416, descrizione: "OGNI DONNA VALE 26" },
  };
  return data[round];
}

// Aggiorna scoreboard visivo
function updateScoreboard() {
  scoreList.innerHTML = "";
  for (const player in players) {
    const li = document.createElement("li");
    li.textContent = `${capitalize(player)}: ${players[player]} punti`;
    scoreList.appendChild(li);
  }
}

// Capitalizza prima lettera
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Round speciale 5
function handleSpecialRound5() {
  roundTitle.textContent = "Round 5: 8º e 13º";
  roundForm.innerHTML = "";

  const label8 = document.createElement("label");
  label8.textContent = "Chi ha preso l'8º:";
  const select8 = document.createElement("select");

  const label13 = document.createElement("label");
  label13.textContent = "Chi ha preso la 13º:";
  const select13 = document.createElement("select");

  for (const player in players) {
    [select8, select13].forEach(select => {
      const option = document.createElement("option");
      option.value = player;
      option.textContent = capitalize(player);
      select.appendChild(option);
    });
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
    players[select8.value] += 52;
    players[select13.value] += 52;

    updateScoreboard();
    startNextRound();
  };

  updateScoreboard();
}

// Round speciale 6
function handleSpecialRound6() {
  roundTitle.textContent = "Round 6: Kappone";
  roundForm.innerHTML = "";

  const label = document.createElement("label");
  label.textContent = "Vincitore del Kappone:";
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
    players[select.value] += 104;

    updateScoreboard();
    startNextRound();
  };

  updateScoreboard();
}

// Round finale (7)
function handleFinalRound() {
  roundTitle.textContent = "Round 7: ÜBER ALLES";
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
    { label: "8º/13º (x52)", name: "mani", multiplier: 52 },
  ];

  const inputs = {};

  fields.forEach(field => {
    const lbl = document.createElement("label");
    lbl.textContent = field.label;
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.name = field.name;

    roundForm.appendChild(lbl);
    roundForm.appendChild(inp);
    inputs[field.name] = inp;
  });

  const labelK = document.createElement("label");
  labelK.textContent = "Kappone?";
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
    let total = 0;
    const sel = selectPlayer.value;

    fields.forEach(field => {
      const val = parseInt(inputs[field.name].value || "0");
      total += val * field.multiplier;
    });

    if (checkK.checked) {
      total += 104;
    }

    players[sel] += total;

    updateScoreboard();
    roundTitle.textContent = "Punteggio finale raggiunto! 🏆";
    roundForm.innerHTML = "";
  };

  updateScoreboard();
}
