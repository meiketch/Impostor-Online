const STORAGE_KEYS = {
  players: "impostor-players-v1",
  settings: "impostor-settings-v1",
  round: "impostor-round-v1",
  shared: "impostor-shared-state-v1",
  theme: "impostor-theme-v1",
};

const defaultSettings = {
  impostorCount: 1,
  jesterCount: 0,
  detectiveCount: 0,
  itemsPerDetective: 1,
  doppelgangerCount: 0,
  difficulty: "random",
  jesterProbability: 25,
  detectiveProbability: 25,
  doppelgangerProbability: 0,
  jesterRandomEnabled: false,
  detectiveRandomEnabled: false,
  doppelgangerRandomEnabled: false,
};

const detectiveDefaultMessage = "Extrawort: Käse";

const detectiveItems = [
  { name: "🔫 Instant Vote", description: "Der DT kann jederzeit einen Spieler sofort aus dem Spiel entfernen.", minPlayers: 0 },
  { name: "❤️ Wiederbelebung", description: "Der DT kann einen ausgespielten Spieler wieder zurückholen.", minPlayers: 0 },
  { name: "🚫 Extra-Wort", description: "Der DT bestimmt ein zusätzliches verbotenes Wort.", minPlayers: 0 },
  { name: "🛡️ Immunität", description: "Der DT schützt einen Spieler für mehrere Runden.", minPlayers: 0 },
  { name: "🔄 Rollenwechsel", description: "Der DT darf die Sitzordnung frei verändern.", minPlayers: 0 },
  { name: "⏭️ Skip", description: "Der DT kann einen Hinweis überspringen lassen.", minPlayers: 0 },
  { name: "⚖️ Zwangsvote", description: "Der DT erzwingt sofort eine Abstimmung.", minPlayers: 0 },
  { name: "❌ Veto", description: "Der DT kann eine Abstimmung aufheben.", minPlayers: 0 },
  { name: "⚡ Fast Forward", description: "Jeder muss pro Runde zwei Hinweise geben.", minPlayers: 0 },
  { name: "🔫 Goldene Pistole", description: "Der DT trifft einen Impostor direkt. Kein Impostor = Schütze scheidet aus.", minPlayers: 8 },
];

const rulesHtml = `
  <h2>IMPOSTOR</h2>
  <h3>Das Partyspiel um Bluff, Misstrauen und Chaos</h3>

  <h3>1. Spielidee</h3>
  <p>Bei <strong>IMPOSTOR</strong> kennen die meisten Spieler ein geheimes Wort. Sie müssen es beschreiben, ohne das Wort selbst zu nennen oder zu offensichtlich zu verraten.</p>
  <p>Doch nicht jeder kennt das Wort:</p>
  <ul>
    <li>Die <strong>Impostoren</strong> kennen das Wort nicht und müssen es anhand von Hinweisen herausfinden.</li>
    <li>Der <strong>Jester</strong> kennt das Wort und möchte absichtlich aus dem Spiel fliegen.</li>
    <li>Der <strong>Doppelgänger</strong> verfolgt kein eigenes Teamziel, sondern gewinnt mit der Partei, die das Spiel gewinnt – solange er selbst nicht eliminiert wurde.</li>
    <li>Der <strong>Detektiv</strong> kennt das Wort und ist eine öffentlich bekannte Sonderrolle.</li>
  </ul>
  <p>Durch Beschreibungen, Diskussionen, Lügen, Anschuldigungen und Abstimmungen versuchen die Spieler herauszufinden, wem sie vertrauen können.</p>
  <p><strong>Bluffen und Lügen sind ausdrücklich Teil des Spiels.</strong></p>

  <h3>2. Rollen</h3>
  <h4>Normale Spieler</h4>
  <ul>
    <li>kennen das geheime Wort,</li>
    <li>beschreiben es nach den geltenden Regeln,</li>
    <li>dürfen lügen und bluffen,</li>
    <li>dürfen andere beschuldigen,</li>
    <li>dürfen behaupten, eine andere Rolle zu besitzen,</li>
    <li>gewinnen, wenn die Impostoren ausscheiden und ihre letzte Chance scheitert.</li>
  </ul>

  <h4>Impostor</h4>
  <p>Der Impostor kennt das geheime Wort <strong>nicht</strong>.</p>
  <p>Stattdessen erhält er Hinweise, mit denen er versuchen muss, das Wort herauszufinden.</p>
  <h5>Mehrere Impostoren</h5>
  <ul>
    <li>kennen sie sich gegenseitig,</li>
    <li>sehen alle exakt dieselben Hinweiswörter,</li>
    <li>erhalten sie so viele Hinweiswörter wie Impostoren im Spiel sind.</li>
  </ul>
  <p>Impostoren dürfen sich <strong>offen</strong> miteinander absprechen.</p>
  <p>Verboten ist lediglich geheime Kommunikation, beispielsweise private Nachrichten, Chats, Discord oder andere nicht für alle sichtbare Kommunikation.</p>
  <p>Ein Impostor darf sogar einen anderen Impostor beschuldigen oder gegen ihn stimmen.</p>

  <h4>Das Wort erraten</h4>
  <p>Ein Impostor darf jederzeit versuchen, das geheime Wort zu erraten.</p>
  <p>Sobald ein Impostor das exakte Wort oder eine grammatikalisch zulässige Variante davon als <strong>Rateversuch</strong> nennt, gilt das Wort als erraten.</p>
  <ul>
    <li><strong>Treffer:</strong> Die Impostoren gewinnen sofort.</li>
    <li><strong>Falscher Versuch:</strong> Der Impostor bleibt im Spiel, darf aber nicht einfach aufgrund desselben Versuchs erneut raten.</li>
  </ul>
  <p>Ein Impostor, der das geheime Wort versehentlich selbst nennt, zählt dies ebenfalls als erfolgreichen Rateversuch.</p>

  <h3>3. Jester</h3>
  <p>Der Jester kennt das geheime Wort. Er möchte jedoch <strong>eliminiert werden</strong>.</p>
  <p>Der Jester gewinnt sofort, sobald er aus dem Spiel entfernt wird – unabhängig davon, wodurch dies geschieht.</p>
  <p>Die Identität des Jesters bleibt geheim. Beim Spielstart erfahren alle Spieler außer den Doppelgängern, wie viele Jester in der Runde dabei sind.</p>
  <p>Er kennt das geheime Wort, die Anzahl der Impostoren, der Jester, ob Doppelgänger im Spiel sind und wer der Detektiv ist, aber nicht die anderen Jester.</p>
  <p>Der Jester ist von fast allen normalen Beschreibungsregeln befreit und darf bewusst verdächtig oder provozierend wirken. Die allgemeine Regel gegen das direkte Nennen oder Verwenden des Zielwortes bleibt bestehen.</p>

  <h3>4. Doppelgänger</h3>
  <p>Der Doppelgänger ist eine eigenständige geheime Rolle.</p>
  <p>Er ist kein normaler Spieler, kein Impostor und kein Jester. Er kennt ausschließlich seine eigene Rolle und keine Informationen über das Wort, die Impostoren, den Detektiv oder andere Doppelgänger.</p>
  <p>Der Doppelgänger gewinnt mit der Partei, die das Spiel gewinnt, solange er selbst nicht eliminiert wurde.</p>
  <p>Wird er vor dem Spielende herausgewählt oder entfernt, verliert er unabhängig davon, wer anschließend gewinnt.</p>

  <h3>5. Detektiv</h3>
  <p>Der Detektiv ist eine <strong>öffentliche Rolle</strong>.</p>
  <p>Alle Spieler wissen, wer der Detektiv ist. Er kennt das geheime Wort, die Anzahl der Impostoren, die Anzahl der Jester, ob Doppelgänger im Spiel sind und seine eigene Rolle. Er beschreibt das Wort grundsätzlich wie ein normaler Spieler.</p>
  <p>Der Detektiv ist grundsätzlich <strong>nicht stimmberechtigt</strong>.</p>

  <h3>6. Detektiv-Items</h3>
  <p>Der Detektiv erhält eine Auswahl verschiedener Items. Alle Spieler wissen, welche Items grundsätzlich verfügbar sind, wie viele dazu gehören und wie viele der Detektiv verwenden kann.</p>
  <p>Ein verwendetes Item ist verbraucht. Bestimmte Items können an andere Spieler weitergegeben werden; der Besitzer entscheidet anschließend selbst, was damit geschieht.</p>
  <p>Wird der Detektiv eliminiert, wird ein Detektiv-Item, das sich noch beim Detektiv befindet, deaktiviert, sofern es über das gesamte Spiel hinweg aktiv war. Bereits weitergegebene Items verfallen nicht.</p>

  <h3>7. Beschreibungen</h3>
  <p>In jeder Runde sagt jeder lebende Spieler einmal etwas zum geheimen Wort.</p>
  <p>Eine normale Beschreibung besteht grundsätzlich aus <strong>einem Wort</strong>; bis zu <strong>drei Wörter</strong> sind erlaubt, wenn sie zusammen eine sinnvolle kurze Wortgruppe bilden.</p>
  <p>Verboten sind das geheime Wort selbst, Bestandteile des Zielwortes, Teile bzw. Wortstämme, zusammengesetzte Wörter mit verbotenen Bestandteilen, Übersetzungen, einzelne Buchstaben, Silben, Aussagen wie „Der erste Teil des Wortes ist …“, allgemeine Synonyme und grammatikalische Varianten des Zielwortes.</p>
  <p><strong>Fair Play:</strong> Das Spiel lebt davon, dass die Spieler clever beschreiben, ohne die Regeln auszutricksen.</p>

  <h3>8. Bluffen und Lügen</h3>
  <p><strong>IMPOSTOR</strong> ist ausdrücklich ein Spiel mit Täuschung.</p>
  <p>Spieler dürfen über ihre Informationen lügen. Sie dürfen beispielsweise behaupten, der Detektiv zu sein, das Wort zu kennen, Impostor zu sein, jemanden zu verdächtigen oder ein Item benutzt zu haben.</p>
  <p>Nicht erlaubt ist es, Informationen zu verwenden, die ein Spieler ausschließlich durch einen Blick hinter die technische Umsetzung des Spiels erhält, etwa aus Quellcode, internen Spieldaten, Debug-Informationen oder ähnlichen technischen Quellen.</p>

  <h3>9. Rundenablauf</h3>
  <p>Die erste Runde beginnt bei einem beliebigen Spieler. Danach geht es der Reihe nach weiter.</p>
  <p>Beispiel: A → B → C → D → A → B …</p>
  <p>Wird B eliminiert, wird daraus: A → C → D → A → C …</p>
  <p>Jeder lebende Spieler ist einmal pro Runde an der Reihe. Eine Runde endet, sobald alle noch lebenden Spieler einmal an der Reihe waren.</p>

  <h3>10. Abstimmungen</h3>
  <p>Eine Abstimmung kann von <strong>jedem stimmberechtigten Spieler jederzeit</strong> ausgelöst werden.</p>
  <p>Der Spieler, der die Abstimmung startet, kann seine Anschuldigung erklären. Danach darf die Gruppe diskutieren. Die beschuldigte Person erhält die Möglichkeit, sich kurz zu verteidigen. Anschließend wird offen abgestimmt.</p>
  <p>Stimmberechtigt sind grundsätzlich normale Spieler, Impostoren, Jester und Doppelgänger. Der Detektiv ist grundsätzlich nicht stimmberechtigt.</p>
  <p>Eine Person wird nur eliminiert, wenn sie <strong>mehr als 50 % der gesamten stimmberechtigten Spieler</strong> auf sich vereint. Es reicht also nicht, genau die Hälfte der Stimmen zu bekommen.</p>
  <p>Erreicht niemand eine echte Mehrheit, wird niemand eliminiert.</p>

  <h3>11. Sonderregel: Drei erfolglose Abstimmungen</h3>
  <p>Um zu verhindern, dass eine Gruppe das Spiel durch endlose Pattsituationen blockiert, gilt:</p>
  <p><strong>Sobald mindestens 4 Spieler leben und drei Abstimmungen hintereinander erfolglos geblieben sind, muss anschließend ein Spieler ausscheiden.</strong></p>
  <p>Wenn sich die Spieler nach der dritten erfolglosen Abstimmung <strong>nicht</strong> darauf einigen können, wer ausscheidet, wird derjenige eliminiert, der die erste der drei erfolglosen Abstimmungen gestartet hat.</p>

  <h3>12. Ausscheiden</h3>
  <p>Wird ein Spieler eliminiert, wird seine tatsächliche Rolle aufgedeckt. Bis zu diesem Zeitpunkt darf der Spieler gelogen haben.</p>
  <p>Ein ausgeschiedener Impostor erhält <strong>genau einen letzten Rateversuch</strong>, wenn er durch Abstimmung eliminiert wurde.</p>
  <ul>
    <li><strong>Richtig:</strong> Das gesamte Impostor-Team gewinnt sofort.</li>
    <li><strong>Falsch:</strong> Der Impostor ist endgültig ausgeschieden.</li>
  </ul>
  <p>Bleibt nach einem falschen letzten Rateversuch kein lebender Impostor mehr übrig, gewinnen die normalen Spieler. Bleibt mindestens ein anderer Impostor am Leben, wird weitergespielt.</p>
  <p>Der Jester gewinnt sofort, sobald er eliminiert wird. Der Doppelgänger verliert, wenn er eliminiert wird. Der Detektiv verliert und scheidet aus.</p>

  <h3>13. Die Impostor-Mehrheitsregel</h3>
  <p>Das Spiel endet für die Impostoren, sobald eine Abstimmung gegen sie faktisch nicht mehr sinnvoll möglich ist.</p>
  <p>Die Impostoren gewinnen sofort, wenn:</p>
  <p><strong>Anzahl lebender Impostoren ≥ Anzahl relevanter lebender Gegenspieler</strong></p>
  <p>Grundsätzlich zählen normale Spieler, Jester und Doppelgänger. Der Detektiv zählt niemals für diese Berechnung.</p>
  <p><strong>Sonderregel für den Jester:</strong> Solange mindestens 4 Spieler leben, zählt der Jester als Gegenspieler. Sobald weniger als 4 Spieler leben, zählt der Jester nicht mehr. Der Doppelgänger zählt immer.</p>

  <h3>14. Siegbedingungen</h3>
  <h4>Normale Spieler</h4>
  <p>Die normalen Spieler gewinnen, wenn:</p>
  <ul>
    <li>kein Impostor mehr lebt,</li>
    <li>und ein ausgeschiedener letzter Impostor seinen finalen Rateversuch falsch abgegeben hat.</li>
  </ul>

  <h4>Impostoren</h4>
  <p>Die Impostoren gewinnen, wenn:</p>
  <ol>
    <li>ein Impostor das geheime Wort korrekt errät,</li>
    <li>ein ausgeschiedener Impostor seinen letzten Rateversuch korrekt abgibt,</li>
    <li>die Impostor-Mehrheitsregel erreicht wird.</li>
  </ol>

  <h4>Jester</h4>
  <p>Der Jester gewinnt, sobald er eliminiert wird.</p>

  <h4>Doppelgänger</h4>
  <p>Der Doppelgänger gewinnt mit der Partei, die das Spiel gewinnt, solange er selbst nicht eliminiert wurde.</p>

  <h3>15. Rollenverteilung</h3>
  <p>Die genaue Rollenverteilung kann an die Größe der Gruppe angepasst werden. Mehrere Sonderrollen können gleichzeitig vorhanden sein, sofern die Spielerzahl dies sinnvoll zulässt.</p>
  <p>Mehrere Jester oder mehrere Doppelgänger sind möglich. Mehrere Doppelgänger kennen sich nicht.</p>

  <h3>16. Grundprinzip des Spiels</h3>
  <p>IMPOSTOR funktioniert am besten, wenn die Spieler ihre Informationen nicht nur logisch, sondern auch sozial bewerten.</p>
  <p>Ein Spieler darf überzeugend lügen, völlig falsche Anschuldigungen machen, sich absichtlich verdächtig verhalten, andere gegeneinander ausspielen, einen Mitspieler verteidigen, einen Verbündeten beschuldigen, sich als andere Rolle ausgeben oder bewusst Chaos verursachen.</p>
  <p>Solange die Regeln eingehalten werden, ist <strong>Täuschung kein Regelbruch, sondern Teil des Spiels</strong>.</p>
  <p>Das Ziel ist nicht, möglichst ordentlich zu spielen. Das Ziel ist, die anderen davon zu überzeugen, dass <strong>du recht hast</strong>.</p>
`;

const state = {
  lobbyCode: null,
  currentPlayerId: sessionStorage.getItem("impostor-player-id") || null,
  hostId: null,
  isHost: false,
  players: [],
  settings: { ...defaultSettings },
  round: null,
  wordDeck: [],
  wordDeckByDifficulty: {
    easy: [],
    medium: [],
    hard: [],
    veryHard: [],
  },
  detectiveMessage: "",
  statusMessage: "",
  lobbyPollTimer: null,
  supabaseUserId: null,
  rolePayload: null,
  syncedRoundId: null,
  roundIdFromServer: null,
  currentScreen: "login",
  previousScreen: null,
  screenDirection: "forward",
};

let supabaseClient = null;
let subscriptionChannel = null;
let supabaseReady = false;

document.addEventListener("DOMContentLoaded", async () => {
  initializeTheme();
  bindEvents();
  await loadWords();
  if (!state.currentPlayerId) {
    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
      // Lokaler Modus: frischer Start ohne Multiplayer-Reste.
      localStorage.removeItem(STORAGE_KEYS.shared);
      localStorage.removeItem(STORAGE_KEYS.players);
      localStorage.removeItem(STORAGE_KEYS.round);
      state.lobbyCode = null;
      state.players = [];
      state.round = null;
    } else {
      // Supabase-Modus: Identität kommt aus der Auth-Session (Restore der Lobby bleibt erhalten).
      localStorage.removeItem(STORAGE_KEYS.round);
      state.round = null;
    }
  }
  hydrateSharedState();
  hydrateSettings();
  hydratePlayers();
  hydrateRound();
  syncFromStorage();
  supabaseReady = await initSupabase();
  if (supabaseReady) {
    state.currentPlayerId = state.supabaseUserId;
    saveIdentity(state.supabaseUserId);
    state.round = null;
    localStorage.removeItem(STORAGE_KEYS.round);
  }
  
  // On page reload: remove player from old lobby and clear lobby state
  if (supabaseReady && state.lobbyCode) {
    try {
      await supabaseClient
        .from("lobby_players")
        .delete()
        .eq("lobby_code", state.lobbyCode)
        .eq("player_id", state.currentPlayerId);
    } catch (error) {
      console.warn("Could not remove player from lobby on reload:", error);
    }
    state.lobbyCode = null;
    state.players = [];
    state.hostId = null;
    state.isHost = false;
    state.roundIdFromServer = null;
    state.rolePayload = null;
    localStorage.removeItem(STORAGE_KEYS.shared);
  }
  
  if (supabaseReady && state.lobbyCode) {
    try {
      const lobby = await loadLobby(state.lobbyCode);
      if (lobby) {
        state.players = lobby.players;
        state.settings = lobby.settings;
        state.hostId = lobby.hostId;
        state.isHost = state.hostId === state.currentPlayerId;
        state.round = lobby.round;
        state.roundIdFromServer = lobby.roundId;
        if (lobby.roundId) await loadOwnRolePayload(lobby.roundId);
        await loadLatestDetectiveMessage();
        subscribeToLobby();
        
        // Navigate to appropriate screen - only if round is still active
        if (state.round && state.roundIdFromServer && state.rolePayload) {
          state.currentScreen = "game";
        } else if (state.round && state.roundIdFromServer) {
          state.currentScreen = "role-loading";
        } else {
          state.currentScreen = "lobby";
        }
      }
    } catch (error) {
      showStatus(error.message);
    }
  }
  render();
});

window.addEventListener("storage", (event) => {
  if (!event.key || event.key !== STORAGE_KEYS.shared) return;
  if (!event.newValue) return;

  try {
    const incoming = JSON.parse(event.newValue);
    if (!incoming) return;

    if (incoming.lobbyCode) state.lobbyCode = incoming.lobbyCode;
    if (incoming.hostId) state.hostId = incoming.hostId;
    if (Array.isArray(incoming.players) && (!supabaseReady || !state.lobbyCode)) state.players = incoming.players;
    if (incoming.settings) state.settings = { ...defaultSettings, ...incoming.settings };
    if (incoming.round && !(supabaseReady && state.lobbyCode)) state.round = incoming.round;
    render();
  } catch (error) {
    console.warn("Shared state sync failed:", error);
  }
});

// ============ SCREEN NAVIGATION ============
function navigateToScreen(screenName, direction = "forward") {
  const validScreens = ["login", "lobby", "role-loading", "game"];
  if (!validScreens.includes(screenName)) return;
  
  state.previousScreen = state.currentScreen;
  state.screenDirection = direction;
  state.currentScreen = screenName;
  renderScreens();
}

// ============ PLAYER AVATAR GENERATOR ============
function generatePlayerAvatar(playerId) {
  const colors = ["#8b5cf6", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
  const colorIndex = playerId.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  const initiale = playerId[0].toUpperCase();
  
  const svg = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="${color}" rx="50%"/>
    <text x="16" y="20" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${initiale}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============ LEAVE CONFIRMATION MODAL ============
function showLeaveConfirmation() {
  const modal = document.createElement("div");
  modal.className = "confirm-modal";
  modal.innerHTML = `
    <div class="confirm-modal-backdrop"></div>
    <div class="confirm-modal-dialog">
      <h2>Lobby verlassen</h2>
      <p>Sicher, dass du die Lobby verlassen möchtest?</p>
      <div class="confirm-modal-footer">
        <button class="secondary" data-action="cancel">Abbrechen</button>
        <button class="primary" data-action="confirm">Ja, verlassen</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const cancelBtn = modal.querySelector('[data-action="cancel"]');
  const confirmBtn = modal.querySelector('[data-action="confirm"]');
  const backdrop = modal.querySelector(".confirm-modal-backdrop");
  
  const closeModal = () => {
    if (modal.parentElement) modal.remove();
  };
  
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  }, { once: true });
  
  confirmBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
    leaveLobby();
  }, { once: true });
  
  backdrop.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  });
}

// ============ LEAVE LOBBY ============
async function leaveLobby() {
  try {
    if (state.lobbyCode && supabaseReady) {
      await supabaseClient
        .from("lobby_players")
        .delete()
        .eq("lobby_code", state.lobbyCode)
        .eq("player_id", state.currentPlayerId);
      
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    }
    
    state.lobbyCode = null;
    state.players = [];
    state.round = null;
    state.rolePayload = null;
    state.hostId = null;
    state.isHost = false;
    state.roundIdFromServer = null;
    
    localStorage.removeItem(STORAGE_KEYS.shared);
    localStorage.removeItem(STORAGE_KEYS.round);
    
    navigateToScreen("login", "backward");
  } catch (error) {
    console.error("Error leaving lobby:", error);
    showStatus("Fehler beim Verlassen der Lobby");
  }
}

function bindEvents() {
  const rulesModal = document.getElementById("rules-modal");
  const rulesContent = document.getElementById("rules-content");

  document.getElementById("theme-select").addEventListener("change", (event) => {
    applyTheme(event.target.value);
    localStorage.setItem(STORAGE_KEYS.theme, event.target.value);
  });

  document.getElementById("rules-btn").addEventListener("click", () => {
    if (!rulesContent) return;
    rulesContent.innerHTML = rulesHtml;
    if (rulesModal) {
      rulesModal.classList.remove("hidden");
      rulesModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  });

  document.getElementById("close-rules-btn").addEventListener("click", () => {
    if (!rulesModal) return;
    rulesModal.classList.add("hidden");
    rulesModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  });

  document.querySelectorAll("[data-close]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!rulesModal) return;
      rulesModal.classList.add("hidden");
      rulesModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && rulesModal && !rulesModal.classList.contains("hidden")) {
      rulesModal.classList.add("hidden");
      rulesModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  });

  // Use event delegation for dynamic button handling
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("#create-lobby-btn");
    if (btn) {
      event.preventDefault();
      event.stopPropagation();
      const name = getPlayerName();
      if (!name) {
        showStatus("Gib zuerst deinen Namen ein.");
        return;
      }
      const code = generateLobbyCode();
      const player = { id: supabaseReady ? state.supabaseUserId : createPlayerId(), name };
      if (!player.id) {
        showStatus("Multiplayer-Identität nicht verfügbar.");
        return;
      }
      state.currentPlayerId = player.id;
      state.lobbyCode = code;
      state.hostId = player.id;
      state.isHost = true;
      state.players = [player];
      state.round = null;
      saveIdentity(player.id);
      try {
        if (supabaseReady) {
          const synced = await syncToSupabase();
          if (!synced) {
            showStatus("Fehler beim Speichern. Versuche es erneut.");
            return;
          }
          const joined = await addPlayerToLobby(player);
          if (!joined) {
            showStatus("Fehler beim Beitreten. Versuche es erneut.");
            return;
          }
          subscribeToLobby();
        }
        state.statusMessage = "";
        navigateToScreen("lobby", "forward");
        render();
      } catch (error) {
        console.error("Lobby creation failed:", error);
        showStatus(error.message || "Lobby konnte nicht erstellt werden.");
      }
      return;
    }

    const joinBtn = event.target.closest("#join-lobby-btn");
    if (joinBtn) {
      event.preventDefault();
      event.stopPropagation();
      const name = getPlayerName();
      const code = document.getElementById("join-code-input").value.trim().toUpperCase();
      if (!name || !code) {
        showStatus("Gib deinen Namen und einen Lobby-Code ein.");
        return;
      }
      if (!supabaseReady) {
        showStatus("Multiplayer ist nicht verbunden. Prüfe die Supabase-Konfiguration.");
        return;
      }
      if (!isValidLobbyCode(code)) {
        showStatus("Ungültiger Lobby-Code (5 Zeichen, ohne 0/O/1/I).");
        return;
      }

      try {
        const lobby = await loadLobby(code);
        if (!lobby) {
          showStatus("Diese Lobby wurde nicht gefunden.");
          return;
        }
        const player = { id: supabaseReady ? state.supabaseUserId : createPlayerId(), name };
        state.currentPlayerId = player.id;
        state.lobbyCode = code;
        state.hostId = lobby.hostId;
        state.isHost = state.hostId === player.id;
        state.players = [...lobby.players, player];
        state.settings = { ...defaultSettings, ...lobby.settings };
        state.round = lobby.round || null;
        saveIdentity(player.id);
        const joined = await addPlayerToLobby(player);
        if (!joined) {
          showStatus("Fehler beim Beitreten. Versuche es erneut.");
          return;
        }
        if (lobby.roundId) await loadOwnRolePayload(lobby.roundId);
        await loadLatestDetectiveMessage();
        subscribeToLobby();
        state.statusMessage = "";
        navigateToScreen("lobby", "forward");
        render();
      } catch (error) {
        console.error("Lobby join failed:", error);
        showStatus(error.message || "Fehler beim Beitreten.");
      }
      return;
    }

    const leaveBtn = event.target.closest("#leave-lobby-btn");
    if (leaveBtn) {
      event.preventDefault();
      event.stopPropagation();
      showLeaveConfirmation();
      return;
    }

    const startGameBtn = event.target.closest("#start-game-btn");
    if (startGameBtn) {
      event.preventDefault();
      event.stopPropagation();
      handleStartGame();
      return;
    }

    const resetLobbyBtn = event.target.closest("#reset-lobby-btn");
    if (resetLobbyBtn) {
      event.preventDefault();
      event.stopPropagation();
      handleResetLobby();
      return;
    }
    // Settings control buttons (increase/decrease counters)
    const controlBtn = event.target.closest("[data-action][data-target]");
    if (controlBtn) {
      event.preventDefault();
      event.stopPropagation();
      if (!state.isHost) return;
      const target = controlBtn.dataset.target;
      const action = controlBtn.dataset.action;
      const current = Number(state.settings[target]) || 0;
      const next = action === "increase" ? current + 1 : Math.max(0, current - 1);
      state.settings[target] = next;
      saveSettings();
      syncToSupabase();
      renderSettings();
      return;
    }
  }, { capture: false });
}

async function handleStartGame() {
  try {
    if (!state.isHost) throw new Error("Nur der Host kann das Spiel starten.");
    if (!state.lobbyCode) {
      throw new Error("Erstelle zuerst eine Lobby.");
    }

    const roleCounts = computeRoleCounts(state.settings);

    if (state.players.length < roleCounts.total + 1) {
      throw new Error("Nicht genügend Spieler für die Rollenverteilung.");
    }

    state.round = createGameRound(state.players, state.settings, roleCounts);
    saveRound();
    
    // Navigate to role-loading screen
    navigateToScreen("role-loading", "forward");
    render();
    
    // Publish roles to Supabase
    await publishRolePayloads(state.round);
  } catch (error) {
    showStatus(error.message);
    navigateToScreen("lobby", "backward");
    render();
  }
}

async function handleResetLobby() {
  if (!state.isHost) {
    showStatus("Nur der Host kann eine neue Runde starten.");
    return;
  }
  state.round = null;
  state.rolePayload = null;
  state.detectiveMessage = "";
  state.roundIdFromServer = null;
  saveRound();
  navigateToScreen("lobby", "forward");
  render();
}

// Global event listeners for input/range changes
document.addEventListener("input", (event) => {
  if (!state.isHost) return;
  
  // Handle range inputs for probabilities
  const rangeInput = event.target;
  if (rangeInput.type === "range") {
    const configKey = rangeInput.id;
    if (!configKey) return;
    state.settings[configKey] = Number(rangeInput.value);
    const outputEl = document.getElementById(`${configKey}Value`);
    if (outputEl) outputEl.textContent = `${rangeInput.value}%`;
    saveSettings();
    syncToSupabase();
  }
});

document.addEventListener("change", (event) => {
  if (!state.isHost) return;
  
  // Handle checkboxes
  if (event.target.type === "checkbox") {
    const configKey = event.target.id;
    if (!configKey) return;
    state.settings[configKey] = event.target.checked;
    saveSettings();
    syncToSupabase();
  }
  
  // Handle select dropdowns
  if (event.target.tagName === "SELECT") {
    if (event.target.id === "difficulty-select") {
      state.settings.difficulty = event.target.value;
      saveSettings();
      syncToSupabase();
    }
  }
});

function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "meme";
  applyTheme(savedTheme);
  document.getElementById("theme-select").value = savedTheme;
}

function applyTheme(theme) {
  const validThemes = ["meme", "neon", "classic", "crt", "bsod", "cork"];
  const selectedTheme = validThemes.includes(theme) ? theme : "meme";
  document.body.dataset.theme = selectedTheme;
  const selector = document.getElementById("theme-select");
  if (selector) selector.value = selectedTheme;
}

function getPlayerName() {
  return document.getElementById("player-name").value.trim();
}

function createPlayerId() {
  const id = createId();
  saveIdentity(id);
  return id;
}

function saveIdentity(id) {
  sessionStorage.setItem("impostor-player-id", id);
}

async function loadWords() {
  try {
    const response = await fetch("./data/words.json");
    if (!response.ok) throw new Error("JSON konnte nicht geladen werden.");
    const rawWords = await response.json();
    state.wordDeckByDifficulty = normalizeWordDeck(rawWords);
    state.wordDeck = Object.values(state.wordDeckByDifficulty).flat();
  } catch (error) {
    console.error("Word deck load failed:", error);
    state.wordDeckByDifficulty = {
      easy: [
        { word: "Baum", clues: ["Wald", "Blätter", "Stamm", "Natur", "Holz"] },
        { word: "Haus", clues: ["Dach", "Zimmer", "Familie", "Wohnen", "Fenster"] },
        { word: "Auto", clues: ["Motor", "Räder", "Fahren", "Straße", "Benzin"] },
        { word: "Katze", clues: ["Schnurrbart", "Tatzen", "Meow", "Haustier", "Whisker"] },
        { word: "Buch", clues: ["Lesen", "Seiten", "Geschichte", "Buchstaben", "Umschlag"] },
      ],
      medium: [],
      hard: [],
      veryHard: [],
    };
    state.wordDeck = Object.values(state.wordDeckByDifficulty).flat();
  }
}

function normalizeWordDeck(rawWords) {
  const normalized = {
    easy: [],
    medium: [],
    hard: [],
    veryHard: [],
  };

  if (!rawWords || typeof rawWords !== "object") return normalized;

  if (Array.isArray(rawWords)) {
    normalized.easy = rawWords;
    normalized.medium = rawWords;
    normalized.hard = rawWords;
    normalized.veryHard = rawWords;
    return normalized;
  }

  Object.entries(normalized).forEach(([difficultyKey, value]) => {
    const category = rawWords[difficultyKey] || rawWords[difficultyKey.toLowerCase()] || rawWords[difficultyKey.replace(/([A-Z])/g, "-$1").toLowerCase()];
    if (Array.isArray(category)) {
      normalized[difficultyKey] = category;
    }
  });

  if (!Object.values(normalized).some((list) => list.length)) {
    const flatWords = Object.values(rawWords).flat().filter(Boolean);
    normalized.easy = flatWords;
    normalized.medium = flatWords;
    normalized.hard = flatWords;
    normalized.veryHard = flatWords;
  }

  return normalized;
}

function hydrateSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.settings);
  if (!saved) {
    saveSettings();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.settings = { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn("Settings invalid:", error);
    state.settings = { ...defaultSettings };
  }
}

function hydratePlayers() {
  const saved = localStorage.getItem(STORAGE_KEYS.players);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.players = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Players invalid:", error);
    state.players = [];
  }
}

function hydrateRound() {
  const saved = localStorage.getItem(STORAGE_KEYS.round);
  if (!saved) return;

  try {
    state.round = JSON.parse(saved);
  } catch (error) {
    console.warn("Round invalid:", error);
    state.round = null;
  }
}

function hydrateSharedState() {
  const saved = localStorage.getItem(STORAGE_KEYS.shared);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (parsed.lobbyCode) state.lobbyCode = parsed.lobbyCode;
    if (parsed.hostId) state.hostId = parsed.hostId;
    if (Array.isArray(parsed.players)) state.players = parsed.players;
    if (parsed.settings) state.settings = { ...defaultSettings, ...parsed.settings };
    if (parsed.round) state.round = parsed.round;
  } catch (error) {
    console.warn("Shared state invalid:", error);
  }
}

function syncFromStorage() {
  hydrateSharedState();
  hydrateSettings();
  hydratePlayers();
  hydrateRound();
}

function savePlayers() {
  localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(state.players));
  persistSharedState();
  syncToSupabase();
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  persistSharedState();
}

function saveRound() {
  // Im Supabase-Modus landet die Runde NIE in localStorage – nur die eigene Rolle.
  if (state.round && !supabaseReady) {
    localStorage.setItem(STORAGE_KEYS.round, JSON.stringify(state.round));
  } else {
    localStorage.removeItem(STORAGE_KEYS.round);
  }
  persistSharedState();
  syncToSupabase();
}

function persistSharedState() {
  const payload = {
    lobbyCode: state.lobbyCode,
    players: state.players,
    settings: state.settings,
    round: supabaseReady ? null : state.round,
    hostId: state.hostId,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.shared, JSON.stringify(payload));
}

function render() {
  renderScreens();
  renderLobbyMeta();
  renderLobbyPlayers();
  renderSettings();
  renderPrivateRoleCard();
  renderRoundSummary();
}

function renderScreens() {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.removeAttribute("data-active");
  });
  
  const activeScreen = document.querySelector(`[data-screen="${state.currentScreen}"]`);
  if (activeScreen) {
    activeScreen.setAttribute("data-active", "true");
    activeScreen.setAttribute("data-direction", state.screenDirection);
  }
  
  // Auto-navigate to game when role-loading and rolePayload arrives
  if (state.currentScreen === "role-loading" && state.rolePayload) {
    setTimeout(() => {
      navigateToScreen("game", "forward");
    }, 300);
  }
}

function renderLobbyMeta() {
  const meta = document.getElementById("lobby-meta");
  const connection = document.getElementById("connection-status");
  connection.textContent = supabaseReady ? "● Multiplayer verbunden" : "○ Multiplayer nicht verbunden";
  connection.style.color = supabaseReady ? "var(--green)" : "var(--gold)";
  if (!state.lobbyCode) {
    meta.textContent = "Noch keine Lobby aktiv.";
    meta.classList.add("empty-state");
    return;
  }

  meta.classList.remove("empty-state");
  const host = state.players.find((player) => player.id === state.hostId) || state.players[0];
  meta.innerHTML = `<strong>Lobby-Code:</strong> <span class="lobby-code">${escapeHtml(state.lobbyCode)}</span><br><span>Host: ${escapeHtml(host?.name || "wird geladen")}</span>`;
}

function renderLobbyPlayers() {
  const container = document.getElementById("player-list");
  document.getElementById("player-count").textContent = state.players.length;
  if (!state.players.length) {
    container.innerHTML = '<div class="empty-state">Noch keine Spieler hinzugefügt.</div>';
    return;
  }

  container.innerHTML = state.players
    .map(
      (player) => `
        <div class="player-tag ${player.id === state.hostId ? "is-host" : ""} ${player.id === state.currentPlayerId ? "is-you" : ""}">
          <img class="player-avatar" 
               src="${generatePlayerAvatar(player.id)}" 
               alt="Avatar" 
               loading="lazy" />
          <span class="player-name">${escapeHtml(player.name)}</span>
          ${player.id === state.hostId ? '<span class="host-badge">👑 HOST</span>' : ""}
          ${state.isHost && player.id !== state.currentPlayerId ? `<button type="button" class="remove-player-btn" data-remove-id="${player.id}" aria-label="Spieler entfernen">×</button>` : ""}
        </div>
      `
    )
    .join("");
}

function renderSettings() {
  document.getElementById("host-controls").classList.remove("hidden");
  document.getElementById("host-actions").classList.toggle("hidden", !state.isHost);
  document.getElementById("settings-permission").textContent = state.isHost ? "Du bist der Host" : "Nur der Host kann ändern";
  document.getElementById("current-player-label").textContent = state.currentPlayerId
    ? `Verbunden als ${state.players.find((player) => player.id === state.currentPlayerId)?.name || "Spieler"}`
    : "Noch keinem Spieler beigetreten";
  Object.entries(state.settings).forEach(([key, value]) => {
    const node = document.getElementById(key);
    if (node) node.textContent = String(value);
  });

  document.getElementById("jesterProbability").value = state.settings.jesterProbability;
  document.getElementById("detectiveProbability").value = state.settings.detectiveProbability;
  document.getElementById("doppelgangerProbability").value = state.settings.doppelgangerProbability;
  document.getElementById("difficulty-select").value = state.settings.difficulty || "random";

  document.getElementById("jesterProbabilityValue").textContent = `${state.settings.jesterProbability}%`;
  document.getElementById("detectiveProbabilityValue").textContent = `${state.settings.detectiveProbability}%`;
  document.getElementById("doppelgangerProbabilityValue").textContent = `${state.settings.doppelgangerProbability}%`;

  document.getElementById("jesterRandomEnabled").checked = !!state.settings.jesterRandomEnabled;
  document.getElementById("detectiveRandomEnabled").checked = !!state.settings.detectiveRandomEnabled;
  document.getElementById("doppelgangerRandomEnabled").checked = !!state.settings.doppelgangerRandomEnabled;

  state.detectiveMessage = state.settings.detectiveMessage || state.detectiveMessage || "";
  document.querySelectorAll("[data-action], #jesterProbability, #detectiveProbability, #doppelgangerProbability, #jesterRandomEnabled, #detectiveRandomEnabled, #doppelgangerRandomEnabled, #difficulty-select").forEach((control) => {
    control.disabled = !state.isHost;
  });
}

function renderPrivateRoleCard() {
  const card = document.getElementById("private-role-card");
  const existingInput = document.getElementById("detective-message-input");
  const draftMessage = existingInput ? existingInput.value : null;
  if (!state.currentPlayerId) {
    card.classList.add("empty-state");
    card.textContent = "Nach dem Spielstart erscheint hier nur deine eigene Rolle.";
    return;
  }

  const player = state.players.find((entry) => entry.id === state.currentPlayerId);
  if (!player) {
    card.classList.add("empty-state");
    card.textContent = "Dieser Spieler existiert nicht mehr.";
    return;
  }

  const role = state.rolePayload || (state.round ? getPlayerRoleInfo(player.id, state.round) : null);
  if (!role) {
    card.classList.add("empty-state");
    card.textContent = state.roundIdFromServer
      ? "Runde gestartet · Rolle wird geladen …"
      : "Nach dem Spielstart erscheint hier nur deine eigene Rolle.";
    return;
  }

  const badgeClass = `role-${role.key}`;
  const detectiveMessage = state.round ? (state.round.detectiveMessage || "") : (state.detectiveMessage || "");
  const canReadMessage = ["detective", "jester", "player"].includes(role.key);
  card.classList.remove("empty-state");
  card.innerHTML = `
    <span class="role-badge ${badgeClass}">${role.label}</span>
    <h3>${escapeHtml(player.name)}</h3>
    <div class="role-info">${escapeHtml(role.message).replace(/\n/g, "<br>")}</div>
    ${detectiveMessage ? `
      <div class="detective-chat-bubble ${canReadMessage ? "is-readable" : "is-redacted"}" aria-label="Detektiv-Nachricht">
        <span class="chat-label">Detektiv</span>
        <span class="chat-message">${canReadMessage ? escapeHtml(detectiveMessage).replace(/\n/g, "<br>") : "████████████"}</span>
      </div>
    ` : ""}
    ${role.key === "detective" ? `
      <div class="detective-message-editor">
        <label for="detective-message-input">Nachricht an die Mitspieler</label>
        <textarea id="detective-message-input" rows="3" aria-label="Detektiv-Nachricht" placeholder="${detectiveDefaultMessage}"></textarea>
        <button id="send-detective-message-btn" class="secondary" type="button">Nachricht senden</button>
      </div>
    ` : ""}
  `;
  const messageInput = document.getElementById("detective-message-input");
  if (messageInput) {
    messageInput.value = draftMessage !== null ? draftMessage : detectiveMessage;
    messageInput.placeholder = detectiveDefaultMessage;
  }
}

document.addEventListener("click", async (event) => {
  if (event.target.id !== "send-detective-message-btn") return;
  if (!state.currentPlayerId) return;
  const isDetective = state.round
    ? state.round.detectives.includes(state.currentPlayerId)
    : Boolean(state.rolePayload && state.rolePayload.key === "detective");
  if (!isDetective) return;

  const message = document.getElementById("detective-message-input").value.trim();
  if (supabaseReady && state.lobbyCode) {
    const { error } = await supabaseClient
      .from("lobby_messages")
      .insert({ lobby_code: state.lobbyCode, author_id: state.currentPlayerId, message });
    if (error) {
      showStatus(`Nachricht konnte nicht gesendet werden (${error.code || "Supabase"}): ${error.message}`);
      return;
    }
    state.detectiveMessage = message;
    renderPrivateRoleCard();
    return;
  }
  if (!state.round) return;
  state.round.detectiveMessage = message;
  saveRound();
  renderPrivateRoleCard();
});

async function addPlayerToLobby(player) {
  try {
    const { error } = await supabaseClient.from("lobby_players").upsert({
      lobby_code: state.lobbyCode,
      player_id: player.id,
      name: player.name,
    }, { onConflict: "lobby_code,player_id" });
    if (error) {
      throw new Error(`Spieler konnte nicht beitreten (${error.code || "Supabase"}): ${error.message}`);
    }
  } catch (error) {
    console.warn("Player join failed:", error);
    showStatus(error.message || "Spieler konnte nicht beitreten.");
    return false;
  }
  state.statusMessage = "";
  await refreshLobbyPlayers();
  return true;
}

async function removePlayerFromLobby(playerId) {
  const { error } = await supabaseClient
    .from("lobby_players")
    .delete()
    .eq("lobby_code", state.lobbyCode)
    .eq("player_id", playerId);
  if (error) console.warn("Player removal failed:", error);
}

function renderRoundSummary() {
  const status = document.getElementById("round-status");
  const summary = document.getElementById("round-summary");

  if (state.statusMessage) {
    status.textContent = state.statusMessage;
    summary.innerHTML = "";
    return;
  }

  if (!state.round) {
    status.textContent = "Noch keine Runde gestartet.";
    summary.innerHTML = "";
    return;
  }

  status.textContent = "Runde läuft · Deine geheime Rolle steht rechts.";
  summary.innerHTML = `<span class="round-live">● LIVE</span><br><span>${state.players.length} Spieler sind dabei.</span>`;
}

function getPlayerRoleInfo(playerId, round) {
  const sharedRoleText = getSharedRoleText(round);
  if (round.impostors.includes(playerId)) {
    return {
      key: "impostor",
      label: "Impostor",
      message: [sharedRoleText, `Deine Hilfswörter: ${round.impostorClues[playerId] || "???"}`, `Mitspieler: ${getNamesForIds(round.impostors.filter((x) => x !== playerId)) || "Keine"}`].filter(Boolean).join("\n"),
    };
  }

  if (round.jesters.includes(playerId)) {
    return {
      key: "jester",
      label: "Jester",
      message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`, "Ziel: Lass dich rausvoten!"].filter(Boolean).join("\n"),
    };
  }

  if (round.detectives.includes(playerId)) {
    const items = round.detectiveItemsMap[playerId] || [];
    return {
      key: "detective",
      label: "Detektiv",
      message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`, `Deine Items:\n- ${items.join("\n- ") || "Keine Items"}`].filter(Boolean).join("\n"),
    };
  }

  if (round.doppelgangers.includes(playerId)) {
    return {
      key: "doppelganger",
      label: "Doppelgänger",
      message: "Du bist der Doppelgänger. Du erhältst keine weiteren Informationen.",
    };
  }

  return {
    key: "player",
    label: "Spieler",
    message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`].filter(Boolean).join("\n"),
  };
}

function getSharedRoleText(round, players = state.players, settings = state.settings) {
  const detectiveNames = getNamesForIds(round.detectives);
  const availableItems = detectiveItems.filter((item) => item.minPlayers <= players.length);
  const itemList = availableItems.map((item) => `${item.name}: ${item.description}`).join("\n- ") || "Keine Items";
  const jesterText = round.jesters.length > 0 ? `Jester: ${round.jesters.length} dabei` : "";

  return [
    `Impostoren: ${round.impostors.length}`,
    jesterText,
    `Detektiv${round.detectives.length === 1 ? "" : "en"}: ${detectiveNames}`,
    round.detectives.length ? `Detektiv-Items zur Auswahl (nutzbar: ${settings.itemsPerDetective} pro Detektiv):\n- ${itemList}` : "",
    `Doppelgänger dabei: ${round.doppelgangers.length > 0 ? "Ja" : "Nein"}`,
  ].filter(Boolean).join("\n");
}

function buildRolePayloads(round, players, settings) {
  const result = {};
  const sharedRoleText = getSharedRoleText(round, players, settings);

  round.impostors.forEach((id) => {
    result[id] = {
      key: "impostor",
      label: "Impostor",
      message: [sharedRoleText, `Deine Hilfswörter: ${round.impostorClues[id] || "???"}`, `Mitspieler: ${getNamesForIds(round.impostors.filter((x) => x !== id)) || "Keine"}`].filter(Boolean).join("\n"),
    };
  });

  round.jesters.forEach((id) => {
    result[id] = {
      key: "jester",
      label: "Jester",
      message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`, "Ziel: Lass dich rausvoten!"].filter(Boolean).join("\n"),
    };
  });

  round.detectives.forEach((id) => {
    const items = round.detectiveItemsMap[id] || [];
    result[id] = {
      key: "detective",
      label: "Detektiv",
      message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`, `Deine Items:\n- ${items.join("\n- ") || "Keine Items"}`].filter(Boolean).join("\n"),
    };
  });

  round.doppelgangers.forEach((id) => {
    result[id] = {
      key: "doppelganger",
      label: "Doppelgänger",
      message: "Du bist der Doppelgänger. Du erhältst keine weiteren Informationen.",
    };
  });

  players.forEach((player) => {
    if (!result[player.id]) {
      result[player.id] = {
        key: "player",
        label: "Spieler",
        message: [sharedRoleText, `Gesuchtes Wort: ${round.word}`].filter(Boolean).join("\n"),
      };
    }
  });

  return result;
}

function getNamesForIds(ids) {
  return ids
    .map((id) => state.players.find((player) => player.id === id)?.name)
    .filter(Boolean)
    .join(", ") || "Keine";
}

function createGameRound(players, settings, roleCounts) {
  const word = selectGameWord();
  const shuffledPlayers = shuffle([...players]);

  const counts = roleCounts || computeRoleCounts(settings);
  const aJester = counts.jesters;
  const aDetective = counts.detectives;
  const aDoppel = counts.doppelgangers;

  const minimumPlayers = counts.total + 1;
  if (players.length < minimumPlayers) {
    throw new Error("Nicht genügend Spieler für diese Rollenverteilung.");
  }

  const impostors = shuffledPlayers.slice(0, counts.impostors).map((player) => player.id);
  const remaining = shuffledPlayers.slice(counts.impostors);

  const jesters = remaining.slice(0, aJester).map((player) => player.id);
  const remainingAfterJester = remaining.slice(aJester);

  const detectives = remainingAfterJester.slice(0, aDetective).map((player) => player.id);
  const remainingAfterDetective = remainingAfterJester.slice(aDetective);

  const doppelgangers = remainingAfterDetective.slice(0, aDoppel).map((player) => player.id);

  const impostorClues = {};
  // Alle Impostoren sehen exakt dieselbe Hinweiswort-Menge (so viele wie Impostoren im Spiel sind).
  const clueCount = Math.min(impostors.length, word.clues.length);
  const sharedClues = shuffle([...word.clues]).slice(0, clueCount);
  const clueText = sharedClues.length ? sharedClues.join(", ") : "???";
  impostors.forEach((impostorId) => {
    impostorClues[impostorId] = clueText;
  });

  const detectiveItemsMap = {};
  const availableItems = detectiveItems.filter((item) => item.minPlayers <= players.length);
  detectives.forEach((playerId) => {
    detectiveItemsMap[playerId] = shuffle([...availableItems]).slice(0, settings.itemsPerDetective).map((item) => `${item.name}: ${item.description}`);
  });

  return {
    id: createId(),
    word: word.word,
    clues: word.clues,
    impostorClues,
    impostors,
    jesters,
    detectives,
    doppelgangers,
    detectiveItemsMap,
    detectiveMessage: "",
    createdAt: Date.now(),
  };
}

function calculateRoleCount(baseCount, probability, randomEnabled) {
  if (baseCount <= 0) return 0;
  if (!randomEnabled) return baseCount;

  let count = 0;
  for (let i = 0; i < baseCount; i += 1) {
    if (Math.random() * 100 < probability) {
      count += 1;
    }
  }
  return count;
}

// Einmal berechnet und sowohl für den Start-Guard als auch für die Runde selbst verwendet,
// damit Prüfung und tatsächliche Rollenverteilung nie auseinanderlaufen.
function computeRoleCounts(settings) {
  const impostors = Math.max(0, Number(settings.impostorCount) || 0);
  const jesters = calculateRoleCount(settings.jesterCount, settings.jesterProbability, settings.jesterRandomEnabled);
  const detectives = calculateRoleCount(settings.detectiveCount, settings.detectiveProbability, settings.detectiveRandomEnabled);
  const doppelgangers = calculateRoleCount(settings.doppelgangerCount, settings.doppelgangerProbability, settings.doppelgangerRandomEnabled);
  return { impostors, jesters, detectives, doppelgangers, total: impostors + jesters + detectives + doppelgangers };
}

function selectGameWord() {
  const difficulty = state.settings?.difficulty || "random";
  const activeDeck = difficulty === "random"
    ? state.wordDeck
    : state.wordDeckByDifficulty[difficulty] || state.wordDeck;

  if (!activeDeck || !activeDeck.length) {
    return { word: "Baum", clues: ["Wald", "Blätter", "Stamm", "Natur", "Holz"] };
  }

  return activeDeck[Math.floor(Math.random() * activeDeck.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const LOBBY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOBBY_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

function isValidLobbyCode(code) {
  return typeof code === "string" && LOBBY_CODE_REGEX.test(code);
}

function generateLobbyCode() {
  const chars = LOBBY_CODE_CHARS;
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function showStatus(message) {
  state.statusMessage = message;
  const statusEl = document.getElementById("status-message");
  if (statusEl) statusEl.textContent = message;
  const roundStatus = document.getElementById("round-status");
  if (roundStatus) roundStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function initSupabase() {
  if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
    return false;
  }

  try {
    if (!window.supabase) {
      console.warn("Supabase SDK nicht verfügbar.");
      return false;
    }

    supabaseClient = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey,
      { auth: { storage: window.sessionStorage } }
    );

    // Identität über eine anonyme Auth-Session (Gerät = Spieler). Nur so kann RLS
    // Rollendaten pro Spieler abschotten – eine statische Seite braucht dafür Auth.
    let { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      const { data, error } = await supabaseClient.auth.signInAnonymously();
      if (error) {
        console.warn("Anonymous sign-in failed:", error.message);
        showStatus("Multiplayer: Anonymous Sign-In ist in Supabase nicht aktiviert (Auth → Providers → Anonymous).");
        return false;
      }
      user = data.user;
    }
    state.supabaseUserId = user.id;
    return true;
  } catch (error) {
    console.warn("Supabase init failed:", error);
    state.supabaseUserId = null;
    return false;
  }
}

async function loadLobby(code) {
  let results;
  try {
    results = await Promise.all([
      supabaseClient.from("game_state").select("*").eq("id", code).maybeSingle(),
      supabaseClient.from("lobby_players").select("player_id, name").eq("lobby_code", code),
    ]);
  } catch (error) {
    throw new Error(`Supabase-Verbindung fehlgeschlagen: ${error.message || "Netzwerkfehler"}`);
  }

  const [stateResult, playersResult] = results;
  if (stateResult.error || playersResult.error) {
    const error = stateResult.error || playersResult.error;
    throw new Error(`Lobby konnte nicht geladen werden (${error.code || "Supabase"}): ${error.message}`);
  }
  const data = stateResult.data;
  if (!data) return null;
  const settings = data.settings || {};
  return {
    players: (playersResult.data || []).map((player) => ({ id: player.player_id, name: player.name })),
    settings: { ...defaultSettings, ...settings },
    hostId: data.host_id || playersResult.data?.[0]?.player_id || null,
    round: data.round || null, // nur im lokalen Modus befüllt; sonst kommen Rollen über player_rounds
    roundId: data.round_id || null,
  };
}

async function refreshLobbyPlayers() {
  if (!state.lobbyCode) return;
  const { data, error } = await supabaseClient
    .from("lobby_players")
    .select("player_id, name")
    .eq("lobby_code", state.lobbyCode);
  if (error) {
    console.warn("Lobby read failed:", error);
    return;
  }
  state.players = (data || []).map((player) => ({
    id: player.player_id,
    name: player.name,
  }));
  render();
}

function subscribeToLobby() {
  if (!supabaseReady || !supabaseClient || !state.lobbyCode) return;
  if (subscriptionChannel) supabaseClient.removeChannel(subscriptionChannel);
  if (state.lobbyPollTimer) clearInterval(state.lobbyPollTimer);

  subscriptionChannel = supabaseClient
    .channel(`lobby-${state.lobbyCode}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "game_state", filter: `id=eq.${state.lobbyCode}` }, (payload) => {
      const row = payload.new;
      if (!row) return;
      const settings = row.settings || {};
      state.settings = { ...defaultSettings, ...settings };
      state.hostId = row.host_id || state.hostId;
      state.isHost = state.hostId === state.currentPlayerId;
      state.roundIdFromServer = row.round_id || null;
      if (row.round_id) {
        if (!state.rolePayload) loadOwnRolePayload(row.round_id);
      } else if (!state.round) {
        state.rolePayload = null;
      }
      render();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "lobby_players", filter: `lobby_code=eq.${state.lobbyCode}` }, () => {
      refreshLobbyPlayers();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "player_rounds", filter: `player_id=eq.${state.currentPlayerId}` }, (payload) => {
      if (!payload.new || !payload.new.payload) return;
      state.rolePayload = payload.new.payload;
      render();
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "lobby_messages", filter: `lobby_code=eq.${state.lobbyCode}` }, (payload) => {
      if (!payload.new || !payload.new.message) return;
      state.detectiveMessage = payload.new.message;
      renderPrivateRoleCard();
    })
    .subscribe();

  state.lobbyPollTimer = setInterval(() => {
    refreshLobbyPlayers();
    refreshGameState();
  }, 3000);
}

// Fallback-Polling für verlorene Realtime-Verbindungen: holt zusätzlich den
// Spielzustand (Settings, Host, Rundenstart), nicht nur die Spielerliste.
async function refreshGameState() {
  if (!state.lobbyCode) return;
  const { data, error } = await supabaseClient
    .from("game_state")
    .select("id, host_id, settings, round_id")
    .eq("id", state.lobbyCode)
    .maybeSingle();
  if (error) {
    console.warn("Game state read failed:", error);
    return;
  }
  if (!data) return;
  const settings = data.settings || {};
  state.settings = { ...defaultSettings, ...settings };
  state.hostId = data.host_id || state.hostId;
  state.isHost = state.hostId === state.currentPlayerId;
  const roundId = data.round_id || null;
  if (roundId && roundId !== state.roundIdFromServer && !state.rolePayload) {
    await loadOwnRolePayload(roundId);
  } else if (!roundId && !state.round) {
    state.rolePayload = null;
  }
  state.roundIdFromServer = roundId;
  render();
}

// Holt ausschließlich die eigene Rollen-Zeile (RLS erlaubt nur die eigene).
async function loadOwnRolePayload(roundId) {
  if (!roundId || !state.currentPlayerId) return;
  const { data, error } = await supabaseClient
    .from("player_rounds")
    .select("payload")
    .eq("lobby_code", state.lobbyCode)
    .eq("player_id", state.currentPlayerId)
    .eq("round_id", roundId)
    .maybeSingle();
  if (error) {
    console.warn("Own role payload read failed:", error);
    return;
  }
  if (data && data.payload) {
    state.rolePayload = data.payload;
    state.syncedRoundId = roundId;
    render();
  } else {
    // If role not found but roundId exists, clear roundId (game likely ended)
    state.roundIdFromServer = null;
    state.rolePayload = null;
  }
}

async function loadLatestDetectiveMessage() {
  if (!supabaseReady || !state.lobbyCode) return;
  const { data, error } = await supabaseClient
    .from("lobby_messages")
    .select("message")
    .eq("lobby_code", state.lobbyCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("Detective message read failed:", error);
    return;
  }
  if (data && data.message) state.detectiveMessage = data.message;
}

async function syncToSupabase() {
  if (!supabaseReady || !supabaseClient || !state.lobbyCode) return true;

  try {
    const hasRound = Boolean(state.round);
    const payload = {
      id: state.lobbyCode,
      host_id: state.hostId,
      settings: state.settings,
      round_id: hasRound ? state.round.id : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from("game_state")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      throw new Error(`Lobby konnte nicht gespeichert werden (${error.code || "Supabase"}): ${error.message}`);
    }

    if (hasRound && state.syncedRoundId !== state.round.id) {
      await publishRolePayloads(state.round);
    }

    if (!hasRound && state.syncedRoundId) {
      await supabaseClient.from("player_rounds").delete().eq("lobby_code", state.lobbyCode);
      await supabaseClient.from("lobby_messages").delete().eq("lobby_code", state.lobbyCode);
      state.rolePayload = null;
      state.syncedRoundId = null;
    }

    return true;
  } catch (error) {
    console.warn("Supabase sync failed:", error);
    showStatus(error.message || "Lobby konnte nicht gespeichert werden.");
    return false;
  }
}

// Der Host verteilt pro Spieler NUR dessen eigene Rolle. Das geheime Wort, die
// komplette Rollenzuordnung und die Impostor-Hilfswörter verlassen den Host nie als Ganzes.
async function publishRolePayloads(round) {
  const rolePayloads = buildRolePayloads(round, state.players, state.settings);
  const rows = state.players.map((player) => ({
    lobby_code: state.lobbyCode,
    player_id: player.id,
    round_id: round.id,
    payload: rolePayloads[player.id] || { key: "player", label: "Spieler", message: "Du hast keine geheime Info." },
  }));

  // Alte Runden-Zeilen der Lobby zuerst entfernen, damit nichts Altlastiges übrig bleibt.
  const { error: deleteError } = await supabaseClient
    .from("player_rounds")
    .delete()
    .eq("lobby_code", state.lobbyCode);
  
  if (deleteError) {
    console.warn("Fehler beim Löschen alter Rollen-Zeilen:", deleteError);
  }

  // Nach dem DELETE direkt INSERT (keine upsert), um INSERT-Policy zu garantieren
  const { error } = await supabaseClient
    .from("player_rounds")
    .insert(rows);

  if (error) {
    // Debug: Prüfe, ob game_state Zeile mit der game_state mit korrektem host_id existiert
    const { data: gameState, error: checkError } = await supabaseClient
      .from("game_state")
      .select("id, host_id")
      .eq("id", state.lobbyCode)
      .maybeSingle();
    
    const debugInfo = gameState
      ? `game_state existiert (host_id="${gameState.host_id}", dein currentPlayerId="${state.currentPlayerId}", state.hostId="${state.hostId}")`
      : `game_state existiert NICHT für lobby_code="${state.lobbyCode}"`;
    
    const fullError = `Rollen konnten nicht verteilt werden (${error.code || "Supabase"}): ${error.message}. [Debug: ${debugInfo}]`;
    console.error(fullError);
    throw new Error(fullError);
  }

  state.rolePayload = rolePayloads[state.currentPlayerId] || null;
  state.syncedRoundId = round.id;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=14").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
