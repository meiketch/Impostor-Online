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

const state = {
  lobbyCode: null,
  currentPlayerId: sessionStorage.getItem("impostor-player-id") || null,
  hostId: null,
  isHost: false,
  players: [],
  settings: { ...defaultSettings },
  round: null,
  wordDeck: [],
  detectiveMessage: "",
  statusMessage: "",
  lobbyPollTimer: null,
};

let supabaseClient = null;
let supabaseReady = false;

document.addEventListener("DOMContentLoaded", async () => {
  initializeTheme();
  bindEvents();
  await loadWords();
  if (!state.currentPlayerId) {
    localStorage.removeItem(STORAGE_KEYS.shared);
    localStorage.removeItem(STORAGE_KEYS.players);
    localStorage.removeItem(STORAGE_KEYS.round);
    state.lobbyCode = null;
    state.players = [];
    state.round = null;
  }
  hydrateSharedState();
  hydrateSettings();
  hydratePlayers();
  hydrateRound();
  syncFromStorage();
  supabaseReady = await initSupabase();
  if (supabaseReady && state.lobbyCode) {
    try {
      const lobby = await loadLobby(state.lobbyCode);
      if (lobby) {
        state.players = lobby.players;
        state.settings = lobby.settings;
        state.hostId = lobby.hostId;
        state.isHost = state.hostId === state.currentPlayerId;
        state.round = lobby.round;
        subscribeToLobby();
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
    if (incoming.round) state.round = incoming.round;
    render();
  } catch (error) {
    console.warn("Shared state sync failed:", error);
  }
});

function bindEvents() {
  document.getElementById("theme-select").addEventListener("change", (event) => {
    applyTheme(event.target.value);
    localStorage.setItem(STORAGE_KEYS.theme, event.target.value);
  });

  document.getElementById("create-lobby-btn").addEventListener("click", async () => {
    const name = getPlayerName();
    if (!name) return showStatus("Gib zuerst deinen Namen ein.");
    const code = generateLobbyCode();
    const player = { id: createPlayerId(), name };
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
        if (!synced) return;
        const joined = await addPlayerToLobby(player);
        if (!joined) return;
        subscribeToLobby();
      }
      state.statusMessage = "";
      render();
    } catch (error) {
      console.error("Lobby creation failed:", error);
      showStatus(error.message || "Lobby konnte nicht erstellt werden.");
    }
  });

  document.getElementById("join-lobby-btn").addEventListener("click", async () => {
    const name = getPlayerName();
    const code = document.getElementById("join-code-input").value.trim().toUpperCase();
    if (!name || !code) return showStatus("Gib deinen Namen und einen Lobby-Code ein.");
    if (!supabaseReady) return showStatus("Multiplayer ist nicht verbunden. Prüfe die Supabase-Konfiguration.");

    try {
      const lobby = await loadLobby(code);
      if (!lobby) return showStatus("Diese Lobby wurde nicht gefunden.");
      const player = { id: createPlayerId(), name };
      state.currentPlayerId = player.id;
      state.lobbyCode = code;
      state.hostId = lobby.hostId;
      state.isHost = state.hostId === player.id;
      state.players = [...lobby.players, player];
      state.settings = { ...defaultSettings, ...lobby.settings };
      state.round = lobby.round || null;
      saveIdentity(player.id);
      render();
      const joined = await addPlayerToLobby(player);
      if (!joined) return;
      subscribeToLobby();
      render();
    } catch (error) {
      console.error("Lobby join failed:", error);
      showStatus(error.message);
    }
  });

  document.getElementById("start-game-btn").addEventListener("click", async () => {
    try {
      if (!state.isHost) throw new Error("Nur der Host kann das Spiel starten.");
      if (!state.lobbyCode) {
        throw new Error("Erstelle zuerst eine Lobby.");
      }

      const totalRequired =
        state.settings.impostorCount +
        state.settings.jesterCount +
        state.settings.detectiveCount +
        state.settings.doppelgangerCount;

      if (state.players.length < totalRequired + 1) {
        throw new Error("Nicht genügend Spieler für die Rollenverteilung.");
      }

      state.round = createGameRound(state.players, state.settings);
      saveRound();
      render();
      await syncToSupabase();
    } catch (error) {
      showStatus(error.message);
    }
  });

  document.getElementById("reset-lobby-btn").addEventListener("click", () => {
    if (!state.isHost) return showStatus("Nur der Host kann eine neue Runde starten.");
    state.round = null;
    saveRound();
    render();
  });

  document.getElementById("player-list").addEventListener("click", (event) => {
    if (!state.isHost) return;
    const button = event.target.closest("[data-remove-id]");
    if (!button) return;

    const id = button.dataset.removeId;
    state.players = state.players.filter((player) => player.id !== id);
    savePlayers();
    removePlayerFromLobby(id);
    render();
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.isHost) return;
      const target = button.dataset.target;
      const action = button.dataset.action;
      const current = Number(state.settings[target]);
      const next = action === "increase" ? current + 1 : Math.max(0, current - 1);

      state.settings[target] = next;
      saveSettings();
      syncToSupabase();
      renderSettings();
    });
  });

  const probInputs = [
    ["jesterProbability", "jesterProbabilityValue", "jesterRandomEnabled"],
    ["detectiveProbability", "detectiveProbabilityValue", "detectiveRandomEnabled"],
    ["doppelgangerProbability", "doppelgangerProbabilityValue", "doppelgangerRandomEnabled"],
  ];

  probInputs.forEach(([rangeId, outputId, toggleId]) => {
    const range = document.getElementById(rangeId);
    const output = document.getElementById(outputId);
    const toggle = document.getElementById(toggleId);

    range.addEventListener("input", () => {
      if (!state.isHost) return;
      const configKey = rangeId;
      state.settings[configKey] = Number(range.value);
      output.textContent = `${range.value}%`;
      saveSettings();
      syncToSupabase();
    });

    toggle.addEventListener("change", () => {
      if (!state.isHost) return;
      const configKey = toggleId;
      state.settings[configKey] = toggle.checked;
      saveSettings();
      syncToSupabase();
    });
  });

}

function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "neon";
  applyTheme(savedTheme);
  document.getElementById("theme-select").value = savedTheme;
}

function applyTheme(theme) {
  const selectedTheme = ["classic", "crt", "bsod", "cork"].includes(theme) ? theme : "neon";
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
    state.wordDeck = await response.json();
  } catch (error) {
    console.error("Word deck load failed:", error);
    state.wordDeck = [
      { word: "Baum", clues: ["Wald", "Blätter", "Stamm", "Natur", "Holz"] },
      { word: "Haus", clues: ["Dach", "Zimmer", "Familie", "Wohnen", "Fenster"] },
      { word: "Auto", clues: ["Motor", "Räder", "Fahren", "Straße", "Benzin"] },
      { word: "Katze", clues: ["Schnurrbart", "Tatzen", "Meow", "Haustier", "Whisker"] },
      { word: "Buch", clues: ["Lesen", "Seiten", "Geschichte", "Buchstaben", "Umschlag"] },
    ];
  }
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
  if (state.round) {
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
    round: state.round,
    hostId: state.hostId,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.shared, JSON.stringify(payload));
}

function render() {
  renderLobbyMeta();
  renderPlayers();
  renderSettings();
  renderPrivateRoleCard();
  renderRoundSummary();
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

function renderPlayers() {
  const container = document.getElementById("player-list");
  document.getElementById("player-count").textContent = state.players.length;
  if (!state.players.length) {
    container.innerHTML = '<div class="empty-state">Noch keine Spieler hinzugefügt.</div>';
    return;
  }

  container.innerHTML = state.players
    .map(
      (player) => `
        <div class="player-tag ${player.id === state.currentPlayerId ? "is-you" : ""}">
          <span>${escapeHtml(player.name)}</span>
          ${player.id === state.hostId ? '<span class="host-mini">HOST</span>' : ""}
          ${state.isHost && player.id !== state.currentPlayerId ? `<button type="button" data-remove-id="${player.id}" aria-label="Spieler entfernen">×</button>` : ""}
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

  document.getElementById("jesterProbabilityValue").textContent = `${state.settings.jesterProbability}%`;
  document.getElementById("detectiveProbabilityValue").textContent = `${state.settings.detectiveProbability}%`;
  document.getElementById("doppelgangerProbabilityValue").textContent = `${state.settings.doppelgangerProbability}%`;

  document.getElementById("jesterRandomEnabled").checked = !!state.settings.jesterRandomEnabled;
  document.getElementById("detectiveRandomEnabled").checked = !!state.settings.detectiveRandomEnabled;
  document.getElementById("doppelgangerRandomEnabled").checked = !!state.settings.doppelgangerRandomEnabled;

  state.detectiveMessage = state.settings.detectiveMessage || state.detectiveMessage || "";
  document.querySelectorAll("[data-action], #jesterProbability, #detectiveProbability, #doppelgangerProbability, #jesterRandomEnabled, #detectiveRandomEnabled, #doppelgangerRandomEnabled").forEach((control) => {
    control.disabled = !state.isHost;
  });
}

function renderPrivateRoleCard() {
  const card = document.getElementById("private-role-card");
  const existingInput = document.getElementById("detective-message-input");
  const draftMessage = existingInput ? existingInput.value : null;
  if (!state.round || !state.currentPlayerId) {
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

  const role = getPlayerRoleInfo(player.id, state.round);
  const badgeClass = `role-${role.key}`;
  const detectiveMessage = state.round.detectiveMessage || "";
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
  if (!state.round || !state.currentPlayerId || !state.round.detectives.includes(state.currentPlayerId)) return;
  state.round.detectiveMessage = document.getElementById("detective-message-input").value.trim();
  saveRound();
  await syncToSupabase();
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
  const detectiveText = getDetectiveText(round);
  const itemsText = getDetectiveItemsText(round);
  if (round.impostors.includes(playerId)) {
    return {
      key: "impostor",
      label: "Impostor",
      message: [`Dein Hilfswort: ${round.impostorClues[playerId] || "???"}`, detectiveText, `Mitspieler: ${getNamesForIds(round.impostors.filter((x) => x !== playerId)) || "Keine"}`, itemsText].filter(Boolean).join("\n"),
    };
  }

  if (round.jesters.includes(playerId)) {
    return {
      key: "jester",
      label: "Jester",
      message: [`Gesuchtes Wort: ${round.word}`, detectiveText, "Ziel: Lass dich rausvoten!", itemsText].filter(Boolean).join("\n"),
    };
  }

  if (round.detectives.includes(playerId)) {
    const items = round.detectiveItemsMap[playerId] || [];
    return {
      key: "detective",
      label: "Detektiv",
      message: [`Gesuchtes Wort: ${round.word}`, detectiveText, `Deine Items:\n- ${items.join("\n- ") || "Keine Items"}`].filter(Boolean).join("\n"),
    };
  }

  if (round.doppelgangers.includes(playerId)) {
    return {
      key: "doppelganger",
      label: "Doppelgänger",
      message: [`Gesuchtes Wort: ${round.word}`, detectiveText, "Du bist nur ein zufälliger Mitspieler.", itemsText].filter(Boolean).join("\n"),
    };
  }

  return {
    key: "player",
    label: "Spieler",
    message: [`Gesuchtes Wort: ${round.word}`, detectiveText, itemsText].filter(Boolean).join("\n"),
  };
}

function getDetectiveName(round) {
  const detectiveId = round.detectives[0];
  return state.players.find((player) => player.id === detectiveId)?.name || "";
}

function getDetectiveText(round) {
  const name = getDetectiveName(round);
  return name ? `Detektiv: ${name}` : "";
}

function getDetectiveItemsText(round) {
  if (!round.detectives.length) return "";
  return `Detektiv-Items:\n- ${getDetectiveItems(round)}`;
}

function getDetectiveItems(round) {
  const items = Object.values(round.detectiveItemsMap || {}).flat();
  return items.join("\n- ") || "Keine Items";
}

function buildRoleMap(round) {
  const result = {};

  round.impostors.forEach((id) => {
    result[id] = {
      key: "impostor",
      label: "Impostor",
      message: `Dein Hilfswort: ${round.impostorClues[id] || "???"}\nMitspieler: ${getNamesForIds(round.impostors.filter((x) => x !== id)) || "Keine"}`,
    };
  });

  round.jesters.forEach((id) => {
    result[id] = {
      key: "jester",
      label: "Jester",
      message: "Ziel: Lass dich rausvoten!",
    };
  });

  round.detectives.forEach((id) => {
    const items = round.detectiveItemsMap[id] || [];
    result[id] = {
      key: "detective",
      label: "Detektiv",
      message: `Du kennst das Wort: ${round.word}\nItems:\n- ${items.join("\n- ") || "Keine Items"}`,
    };
  });

  round.doppelgangers.forEach((id) => {
    result[id] = {
      key: "doppelganger",
      label: "Doppelgänger",
      message: "Du bist nur ein zufälliger Mitspieler.",
    };
  });

  state.players.forEach((player) => {
    if (!result[player.id]) {
      result[player.id] = {
        key: "player",
        label: "Spieler",
        message: "Du hast keine geheime Info.",
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

function createGameRound(players, settings) {
  const word = selectGameWord();
  const shuffledPlayers = shuffle([...players]);

  const aJester = calculateRoleCount(settings.jesterCount, settings.jesterProbability, settings.jesterRandomEnabled);
  const aDetective = calculateRoleCount(settings.detectiveCount, settings.detectiveProbability, settings.detectiveRandomEnabled);
  const aDoppel = calculateRoleCount(settings.doppelgangerCount, settings.doppelgangerProbability, settings.doppelgangerRandomEnabled);

  const minimumPlayers = settings.impostorCount + aJester + aDetective + aDoppel + 1;
  if (players.length < minimumPlayers) {
    throw new Error("Nicht genügend Spieler für diese Rollenverteilung.");
  }

  const impostors = shuffledPlayers.slice(0, settings.impostorCount).map((player) => player.id);
  const remaining = shuffledPlayers.slice(settings.impostorCount);

  const jesters = remaining.slice(0, aJester).map((player) => player.id);
  const remainingAfterJester = remaining.slice(aJester);

  const detectives = remainingAfterJester.slice(0, aDetective).map((player) => player.id);
  const remainingAfterDetective = remainingAfterJester.slice(aDetective);

  const doppelgangers = remainingAfterDetective.slice(0, aDoppel).map((player) => player.id);

  const impostorClues = {};
  const availableClues = shuffle([...word.clues]);
  impostors.forEach((impostorId, index) => {
    const cluePool = availableClues.slice(index, index + 1);
    impostorClues[impostorId] = cluePool[0] || availableClues[0] || "???";
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

function selectGameWord() {
  if (!state.wordDeck.length) {
    return { word: "Baum", clues: ["Wald", "Blätter", "Stamm", "Natur", "Holz"] };
  }

  return state.wordDeck[Math.floor(Math.random() * state.wordDeck.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateLobbyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function showStatus(message) {
  state.statusMessage = message;
  const status = document.getElementById("round-status");
  if (status) status.textContent = message;
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
      window.SUPABASE_CONFIG.anonKey
    );

    return true;
  } catch (error) {
    console.warn("Supabase init failed:", error);
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
    hostId: settings._hostId || playersResult.data?.[0]?.player_id || null,
    round: data.round || null,
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
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  (data || []).forEach((player) => {
    playersById.set(player.player_id, { id: player.player_id, name: player.name });
  });
  state.players = [...playersById.values()];
  render();
}

function subscribeToLobby() {
  if (!supabaseReady || !supabaseClient || !state.lobbyCode) return;
  if (state.lobbySubscription) supabaseClient.removeChannel(state.lobbySubscription);
  if (state.lobbyPollTimer) clearInterval(state.lobbyPollTimer);

  state.lobbySubscription = supabaseClient
    .channel(`lobby-${state.lobbyCode}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "game_state", filter: `id=eq.${state.lobbyCode}` }, (payload) => {
      const row = payload.new;
      if (!row) return;
      const settings = row.settings || {};
      state.settings = { ...defaultSettings, ...settings };
      state.hostId = settings._hostId || state.hostId;
      state.isHost = state.hostId === state.currentPlayerId;
      state.round = row.round || null;
      render();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "lobby_players", filter: `lobby_code=eq.${state.lobbyCode}` }, () => {
      refreshLobbyPlayers();
    })
    .subscribe();

  state.lobbyPollTimer = setInterval(() => {
    refreshLobbyPlayers();
  }, 3000);
}

async function syncToSupabase() {
  if (!supabaseReady || !supabaseClient || !state.lobbyCode) return true;

  try {
    const payload = {
      id: state.lobbyCode,
      settings: { ...state.settings, _hostId: state.hostId, _lobbyCode: state.lobbyCode },
      round: state.round,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from("game_state")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      throw new Error(`Lobby konnte nicht gespeichert werden (${error.code || "Supabase"}): ${error.message}`);
    }
    return true;
  } catch (error) {
    console.warn("Supabase sync failed:", error);
    showStatus(error.message || "Lobby konnte nicht gespeichert werden.");
    return false;
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=14").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
