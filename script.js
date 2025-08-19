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
  // storico dei round confermati (usato per rollback/modify)
  let rounds = [];
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
    renderRoundHistory();
    startNextRound();
  });

  // mostra la cronologia dei round e pulsanti per modificare
  function renderRoundHistory() {
    // container semplice sotto la scoreboard
    let container = document.getElementById('round-history');
    if (!container) {
      container = document.createElement('div');
      container.id = 'round-history';
      container.style.marginTop = '1rem';
      document.querySelector('.scoreboard').appendChild(container);
    }
    container.innerHTML = '';

    rounds.forEach((r, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '4px 0';

      const title = document.createElement('span');
      title.textContent = `Round ${r.round}`;
      title.classList.add('round-title'); // nuova classe
      row.appendChild(title);

      const btns = document.createElement('div');
      const edit = document.createElement('button');
      edit.classList.add('btn-modifica'); // nuova classe
      edit.innerHTML = '<i class="fa fa-pen"></i> Modifica';
      edit.addEventListener('click', () => openEditRound(idx));
      btns.appendChild(edit);

      row.appendChild(btns);
      container.appendChild(row);
    });
  }

  // apre l'interfaccia per modificare un round esistente
  function openEditRound(index) {
    const r = rounds[index];
    if (!r) return;

    // rollback fino al round precedente
    rollbackToRoundIndex(index - 1);

    // prepopola form con i dati del round da modificare
    currentRound = r.round; // impostiamo il numero
    roundForm.innerHTML = '';
    roundTitle.textContent = `Modifica Round ${r.round} (${r.type})`;

    if (r.type === 'standard') {
      const data = { moltiplicatore: r.data.moltiplicatore, target: r.data.target };
      Object.keys(players).forEach(p => {
        const lbl = document.createElement('label');
        lbl.textContent = capitalize(p) + ':';
        const inp = document.createElement('input');
        inp.type = 'number'; inp.min = '0'; inp.name = p;
        inp.value = r.inputs[p] || 0;
        roundForm.append(lbl, inp);
      });
      const btn = document.createElement('button'); btn.type = 'submit'; btn.textContent = 'Salva modifica'; roundForm.appendChild(btn);
      roundForm.onsubmit = e => {
        e.preventDefault();
        const formData = new FormData(roundForm);
        let sum = 0;
        const inputs = {};
        for (const [p, v] of formData.entries()) {
          const count = parseInt(v) || 0;
          inputs[p] = count;
          sum += count * data.moltiplicatore;
        }
        if (sum > data.target) { alert(`Errore: somma ${sum} > target ${data.target}.`); return; }

        // sostituisco lo storico dell'indice e ricalcolo dal punto precedente
        rounds[index] = { round: r.round, type: 'standard', data, inputs };
        // riapplica tutta la cronologia a partire dall'inizio
        replayAllRounds();
        renderRoundHistory();
        startNextRound();
      };
      return;
    }

    if (r.type === 'special5') {
      const select8  = document.createElement('select');
      const select13 = document.createElement('select');
      Object.keys(players).forEach(p => {
        [select8, select13].forEach(sel => {
          const opt = document.createElement('option'); opt.value = p; opt.textContent = capitalize(p); sel.appendChild(opt);
        });
      });
      select8.value = r.winners.eight;
      select13.value = r.winners.thirteen;
      const lbl8  = document.createElement('label'); lbl8.textContent = "Chi ha preso l'8º:";
      const lbl13 = document.createElement('label'); lbl13.textContent = "Chi ha preso la 13º:";
      roundForm.append(lbl8, select8, lbl13, select13);
      const btn = document.createElement('button'); btn.type = 'submit'; btn.textContent = 'Salva modifica'; roundForm.appendChild(btn);
      roundForm.onsubmit = e => {
        e.preventDefault();
        rounds[index] = { round: r.round, type: 'special5', winners: { eight: select8.value, thirteen: select13.value } };
        replayAllRounds(); renderRoundHistory(); startNextRound();
      };
      return;
    }

    if (r.type === 'special6') {
      const select = document.createElement('select');
      Object.keys(players).forEach(p => { const opt = document.createElement('option'); opt.value = p; opt.textContent = capitalize(p); select.appendChild(opt); });
      select.value = r.winner;
      const lbl = document.createElement('label'); lbl.textContent = 'Vincitore del Kappone:'; roundForm.append(lbl, select);
      const btn = document.createElement('button'); btn.type = 'submit'; btn.textContent = 'Salva modifica'; roundForm.appendChild(btn);
      roundForm.onsubmit = e => { e.preventDefault(); rounds[index] = { round: r.round, type: 'special6', winner: select.value }; replayAllRounds(); renderRoundHistory(); startNextRound(); };
      return;
    }

    if (r.type === 'final') {
      // semplifichiamo: permettiamo di rimuovere o sostituire le entries salvate
      roundForm.innerHTML = '';
      const list = document.createElement('div');
      r.entries.forEach((en, i) => {
        const row = document.createElement('div');
        row.textContent = `${capitalize(en.player)}: ${en.points} punti ${en.kappone ? '(Kappone)' : ''}`;
        const del = document.createElement('button'); del.textContent = 'Rimuovi'; del.style.marginLeft='8px';
        del.addEventListener('click', () => { r.entries.splice(i,1); rounds[index] = r; replayAllRounds(); renderRoundHistory(); openEditRound(index); });
        row.appendChild(del);
        list.appendChild(row);
      });
      roundForm.appendChild(list);
      const btnSave = document.createElement('button'); btnSave.type='button'; btnSave.textContent='Salva e Chiudi'; btnSave.addEventListener('click', ()=>{ rounds[index]=r; replayAllRounds(); renderRoundHistory(); startNextRound(); });
      roundForm.appendChild(btnSave);
      return;
    }
  }

  // annulla tutti i punteggi e riapplica i rounds dall'inizio
  function replayAllRounds() {
    // reset
    const names = Object.keys(players);
    names.forEach(n => players[n]=0);
    // riapplica in ordine
    rounds.forEach(r => applyRoundData(r));
    updateScoreboard();
  }

  // rollback fino a un dato indice (inclusivo), cioè mantieni rounds[0..idx]
  function rollbackToRoundIndex(idx) {
    // reset punteggi
    const names = Object.keys(players);
    names.forEach(n => players[n]=0);
    // riapplica i rounds fino a idx incluso
    for (let i=0;i<=idx && i<rounds.length;i++) {
      applyRoundData(rounds[i]);
    }
    updateScoreboard();
    // tronca lo storico alla posizione successiva a idx
    rounds = rounds.slice(0, idx+1);
    renderRoundHistory();
  }

  // applica i dati di un round sullo stato players
  function applyRoundData(r) {
    if (!r) return;
    if (r.type === 'standard') {
      const m = r.data.moltiplicatore;
      Object.keys(r.inputs).forEach(p => { players[p] += (r.inputs[p]||0) * m; });
    } else if (r.type === 'special5') {
      players[r.winners.eight] += 52;
      players[r.winners.thirteen] += 52;
    } else if (r.type === 'special6') {
      players[r.winner] += 104;
    } else if (r.type === 'final') {
      r.entries.forEach(en => { players[en.player] += en.points; });
    }
  }

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

      // raccogli input grezzi per lo storico
      const inputs = {};
      for (const [p, v] of formData.entries()) {
        const count = parseInt(v) || 0;
        inputs[p] = count;
        const delta = count * data.moltiplicatore;
        sum += delta;
      }

      // controllo del target
      if (sum > data.target) {
        alert(`Errore: somma ${sum} > target ${data.target}. Riprova.`);
        return;
      }

      // applica i punteggi e salva lo storico
      Object.keys(inputs).forEach(p => {
        players[p] += inputs[p] * data.moltiplicatore;
      });
      rounds.push({ round: currentRound, type: 'standard', data: { moltiplicatore: data.moltiplicatore, target: data.target }, inputs });

      updateScoreboard();
      renderRoundHistory();
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
  rounds.push({ round: currentRound, type: 'special5', winners: { eight: select8.value, thirteen: select13.value } });
  updateScoreboard();
  renderRoundHistory();
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
  rounds.push({ round: currentRound, type: 'special6', winner: select.value });
  updateScoreboard();
  renderRoundHistory();
  startNextRound();
    };

    updateScoreboard();
  }

  // — Round finale 7 —  
  let accumulatedTotal = 0;       // punti già inseriti in questo round  
  let firstEntryDone   = false;   // true dopo il primo inserimento  
  let firstEntryPoints = 0;       // punteggio del primo inserimento  

  function handleFinalRound() {
    // reset testata e form  
    roundTitle.textContent = "Round 7: ÜBER ALLES";  
    roundForm.innerHTML = "";  

    // select giocatore  
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

    // campi di input  
    const fields = [  
      { lbl: "Prese (x8)",   name: "prese", mult: 8 },  
      { lbl: "Cuori (x8)",   name: "cuori", mult: 8 },  
      { lbl: "J/K (x13)",    name: "jk",    mult: 13 },  
      { lbl: "Donne (x26)",  name: "donne", mult: 26 },  
      { lbl: "8º/13º (x52)", name: "mani",  mult: 52 },  
    ];  
    const inputs = {};  
    fields.forEach(f => {  
      const lbl = document.createElement("label");  
      lbl.textContent = f.lbl;  
      const inp = document.createElement("input");  
      inp.type = "number";  inp.min = "0";  inp.name = f.name;  
      inputs[f.name] = { el: inp, mult: f.mult };  
      roundForm.append(lbl, inp);  
    });  

    // checkbox Kappone  
    const lblK = document.createElement("label");  
    lblK.textContent = "Kappone?";  
    const checkK = document.createElement("input");  
    checkK.type = "checkbox";  checkK.name = "kappone";  
    roundForm.append(lblK, checkK);  

    // bottone aggiungi  
    const btn = document.createElement("button");  
    btn.type = "button";  
    btn.textContent = "Aggiungi punteggi";  
    roundForm.appendChild(btn);  

    // registro degli inserimenti per questo round finale
    const finalEntries = [];

    btn.addEventListener('click', e => {  
      e.preventDefault();  

      // calcolo totale del giro  
      let roundTotal = 0;  
      for (const key in inputs) {  
        roundTotal += (parseInt(inputs[key].el.value) || 0) * inputs[key].mult;  
      }  
      if (checkK.checked) roundTotal += 104;  

      // controllo overflow assoluto  
      if (roundTotal > 624 || accumulatedTotal + roundTotal > 624) {  
        alert("Attenzione: supereresti i 624 punti totali. Rivedi i valori.");  
        return;  
      }  

      // registrazione dell'entry
      finalEntries.push({ player: selPlayer.value, points: roundTotal, kappone: !!checkK.checked });

      // PRIMO INSERIMENTO: controllo chiusura anticipata  
      if (!firstEntryDone) {  
        const remainingAfterFirst = 624 - roundTotal;  
        // aggiorno classifica  
        players[selPlayer.value] += roundTotal;  
        updateScoreboard();  

        // se i punti rimanenti non bastano a superare il primo, chiudo  
        if (remainingAfterFirst < roundTotal) {  
          roundTitle.textContent = "Punteggio finale raggiunto! 🏆";  
          roundForm.innerHTML = "";  
          // salvo lo storico del round finale
          rounds.push({ round: currentRound, type: 'final', entries: finalEntries.slice() });
          renderRoundHistory();
          showEndOverlay();  
          return;  
        }  

        // altrimenti preparo per il secondo inserimento  
        firstEntryDone   = true;  
        firstEntryPoints = roundTotal;  
        accumulatedTotal = roundTotal;  
        // disabilito il giocatore già usato  
        selPlayer.querySelector(`option[value="${selPlayer.value}"]`).disabled = true;  

        // reset degli input  
        Object.values(inputs).forEach(o => o.el.value = "");  
        checkK.checked = false;  
        roundTitle.textContent = `Ancora ${remainingAfterFirst} punti da inserire`;  
        return;  
      }  

      // INSERIMENTI SUCCESSIVI: accumulo fino a 624  
      accumulatedTotal += roundTotal;  
      players[selPlayer.value] += roundTotal;  
      updateScoreboard();  

      if (accumulatedTotal === 624) {  
        roundTitle.textContent = "Punteggio finale raggiunto! 🏆";  
        roundForm.innerHTML = "";  
        // salvo lo storico del round finale
        rounds.push({ round: currentRound, type: 'final', entries: finalEntries.slice() });
        renderRoundHistory();
        showEndOverlay();  
      } else {  
        const remaining = 624 - accumulatedTotal;  
        selPlayer.querySelector(`option[value="${selPlayer.value}"]`).disabled = true;  
        Object.values(inputs).forEach(o => o.el.value = "");  
        checkK.checked = false;  
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