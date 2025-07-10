// =============================
// script.js
// Gestione partita, round speciali e overlay + risultato finale
// =============================
document.addEventListener('DOMContentLoaded', () => {
  // — Riferimenti DOM —
  const playerForm       = document.getElementById("player-form");
  const setupSection     = document.getElementById("player-setup");
  const gameSection      = document.getElementById("game-section");
  const roundTitle       = document.getElementById("round-title");
  const roundForm        = document.getElementById("round-form");
  const scoreList        = document.getElementById("score-list");
  const scoreboardHeader = document.querySelector(".scoreboard h3");
  const endScreen        = document.getElementById("end-screen");
  const closeButton      = document.getElementById("close-end-screen");

  // — Nascondi subito l’overlay —
  endScreen.style.display = "none";

  // — click sulla “✖️” chiude solo l’overlay —
  closeButton.addEventListener("click", () => {
    endScreen.style.display = "none";
  });

  // — Stato di gioco —
  let players = {};
  let currentRound = 0;
  const totalRounds = 7;

  // — Avvio partita: leggi nomi, resetta stato, mostra sezione di gioco —
  playerForm.addEventListener("submit", event => {
    event.preventDefault();
    players = {};
    currentRound = 0;

    playerForm.querySelectorAll("input[type='text']").forEach((inp, i) => {
      const raw = inp.value.trim().toLowerCase();
      const key = raw || `giocatore${i+1}`;
      // previeni nomi duplicati
      players[key in players ? `${key}_${i}` : key] = 0;
    });

    setupSection.style.display = "none";
    gameSection.style.display = "block";
    scoreboardHeader.textContent = "Punteggi attuali:";
    updateScoreboard();
    startNextRound();
  });

  // — Procedi al round successivo —
  function startNextRound() {
    currentRound++;

    // se ho superato l’ultimo round, mostro overlay
    if (currentRound > totalRounds) {
      return showEndOverlay();
    }

    // round speciali
    if (currentRound === 5) return handleSpecialRound5();
    if (currentRound === 6) return handleSpecialRound6();
    if (currentRound === 7) return handleFinalRound();

    // round 1–4 standard
    const data = getRoundData(currentRound);
    roundTitle.textContent = `Round ${currentRound}: ${data.descrizione}`;
    roundForm.innerHTML = "";

    Object.keys(players).forEach(p => {
      const lbl = document.createElement("label");
      lbl.textContent = capitalize(p) + ":";
      const inp = document.createElement("input");
      inp.type = "number"; inp.min = "0"; inp.name = p;
      roundForm.append(lbl, inp);
    });

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Conferma Round";
    roundForm.appendChild(btn);

    roundForm.onsubmit = e => {
      e.preventDefault();
      const formData = new FormData(roundForm);
      let sum = 0;
      const backup = { ...players };

      for (const [p, v] of formData.entries()) {
        const delta = (parseInt(v) || 0) * data.moltiplicatore;
        players[p] += delta;
        sum += delta;
      }
      // controllo del target
      if (sum > data.target) {
        alert(`Errore: somma ${sum} > target ${data.target}. Riprova.`);
        players = backup;
      }

      updateScoreboard();
      startNextRound();
    };

    updateScoreboard();
  }

  // — Dati per i round 1–4 —
  function getRoundData(r) {
    return {
      1: { moltiplicatore: 8,  target: 104, descrizione: "OGNI PRESA VALE 8" },
      2: { moltiplicatore: 8,  target: 208, descrizione: "OGNI CUORE VALE 8" },
      3: { moltiplicatore:13,  target: 312, descrizione: "OGNI K O J VALE 13" },
      4: { moltiplicatore:26,  target: 416, descrizione: "OGNI DONNA VALE 26" },
    }[r];
  }

  // — Round speciale 5 —
  function handleSpecialRound5() {
    roundTitle.textContent = "Round 5: 8º e 13º";
    roundForm.innerHTML = "";

    const select8  = document.createElement("select");
    const select13 = document.createElement("select");
    Object.keys(players).forEach(p => {
      [select8, select13].forEach(sel => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = capitalize(p);
        sel.appendChild(opt);
      });
    });

    const lbl8  = document.createElement("label");
    lbl8.textContent = "Chi ha preso l'8º:";
    const lbl13 = document.createElement("label");
    lbl13.textContent = "Chi ha preso la 13º:";
    roundForm.append(lbl8, select8, lbl13, select13);

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Conferma Round";
    roundForm.appendChild(btn);

    roundForm.onsubmit = e => {
      e.preventDefault();
      players[select8.value]  += 52;
      players[select13.value] += 52;
      updateScoreboard();
      startNextRound();
    };

    updateScoreboard();
  }

  // — Round speciale 6 —
  function handleSpecialRound6() {
    roundTitle.textContent = "Round 6: Kappone";
    roundForm.innerHTML = "";

    const select = document.createElement("select");
    Object.keys(players).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = capitalize(p);
      select.appendChild(opt);
    });

    const lbl = document.createElement("label");
    lbl.textContent = "Vincitore del Kappone:";
    roundForm.append(lbl, select);

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Conferma Round";
    roundForm.appendChild(btn);

    roundForm.onsubmit = e => {
      e.preventDefault();
      players[select.value] += 104;
      updateScoreboard();
      startNextRound();
    };

    updateScoreboard();
  }

  // — Round finale 7 —
  let accumulatedTotal = 0;

  // — Round finale 7 con accumulo fino a 624 —
  function handleFinalRound() {
    roundTitle.textContent = "Round 7: ÜBER ALLES";
    roundForm.innerHTML = "";

    const selPlayer = document.createElement("select");
    Object.keys(players).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = capitalize(p);
      selPlayer.appendChild(opt);
    });
    const lblP = document.createElement("label");
    lblP.textContent = "Giocatore:";
    roundForm.append(lblP, selPlayer);

    const fields = [
      { lbl: "Prese (x8)",  name: "prese", mult: 8 },
      { lbl: "Cuori (x8)",  name: "cuori", mult: 8 },
      { lbl: "J/K (x13)",   name: "jk",    mult: 13 },
      { lbl: "Donne (x26)", name: "donne", mult: 26 },
      { lbl: "8º/13º (x52)",name: "mani",  mult: 52 },
    ];
    const inputs = {};
    fields.forEach(f => {
      const lbl = document.createElement("label");
      lbl.textContent = f.lbl;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.name = f.name;
      inputs[f.name] = { el: inp, mult: f.mult };
      roundForm.append(lbl, inp);
    });

    const lblK = document.createElement("label");
    lblK.textContent = "Kappone?";
    const checkK = document.createElement("input");
    checkK.type = "checkbox";
    checkK.name = "kappone";
    roundForm.append(lblK, checkK);

    const btn = document.createElement("button");
    btn.type = "button"; // changed to button to use click listener
    btn.textContent = "Aggiungi punteggi";
    roundForm.appendChild(btn);

    // Gestione del click sul bottone
    btn.addEventListener('click', e => {
      e.preventDefault();
      let roundTotal = 0;
      for (const key in inputs) {
        roundTotal += (parseInt(inputs[key].el.value) || 0) * inputs[key].mult;
      }
      if (checkK.checked) roundTotal += 104;

      if (accumulatedTotal + roundTotal > 624) {
        alert("Attenzione: il totale accumulato supererebbe 624 punti. Rivedi i valori inseriti.");
        return;
      }

      accumulatedTotal += roundTotal;
      players[selPlayer.value] += roundTotal;
      updateScoreboard();

      if (accumulatedTotal === 624) {
        roundTitle.textContent = "Punteggio finale raggiunto! 🏆";
        roundForm.innerHTML = "";
        showEndOverlay();
      } else {
        Object.values(inputs).forEach(o => o.el.value = "");
        checkK.checked = false;
        const remaining = 624 - accumulatedTotal;
        roundTitle.textContent = `Ancora ${remaining} punti da inserire`;
      }
    });

    updateScoreboard();
  }


  // — Overlay di fine partita —
  // — Overlay di fine partita —
  function showEndOverlay() {
    // Calcolo il vincitore: chi ha il punteggio più alto
    const winner = Object.keys(players).reduce((a, b) =>
      players[a] > players[b] ? a : b
    );
    
    // Rimuovo eventuale banner precedente
    const old = endScreen.querySelector('.end-banner');
    if (old) old.remove();

    // Creo e appendo il banner
    const banner = document.createElement('div');
    banner.className = 'end-banner';
    banner.textContent = `Il king è ${capitalize(winner)}`;
    endScreen.appendChild(banner);

    // Titolo e tabella
    roundTitle.textContent = "La partita è finita!!";
    roundForm.innerHTML = "";
    scoreboardHeader.textContent = "Risultati finali:";
    updateScoreboard();

    // Mostro l’overlay
    endScreen.style.display = "flex";
  }

  // — Aggiorna la classifica a schermo —
  function updateScoreboard() {
    scoreList.innerHTML = "";
    Object.keys(players).forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${capitalize(p)}: ${players[p]} punti`;
      scoreList.appendChild(li);
    });
  }

  // — Utility: maiuscola iniziale —
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
