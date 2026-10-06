// Harness: loads app.js in a stubbed browser context and tests the pure game logic.
const fs = require("fs");
const vm = require("vm");

function makeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _store: store,
  };
}

function stubElement() {
  const el = {
    value: "",
    checked: false,
    textContent: "",
    innerHTML: "",
    dataset: {},
    disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {},
    listeners: {},
    setAttribute() {},
    getAttribute() { return null; },
    focus() { documentStub.activeElement = el; },
    setSelectionRange(start, end, direction) {
      el.selectionStart = start;
      el.selectionEnd = end;
      el.selectionDirection = direction;
    },
    addEventListener(type, fn) { (el.listeners[type] ||= []).push(fn); },
    querySelectorAll() { return []; },
  };
  return el;
}

const elements = new Map();
const documentStub = {
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, stubElement());
    return elements.get(id);
  },
  querySelectorAll: () => [],
  addEventListener() {},
  body: stubElement(),
  createElement: () => stubElement(),
};

const localStorage = makeStorage();
const sessionStorage = makeStorage();

const ctx = {
  console,
  document: documentStub,
  window: {
    addEventListener() {},
    crypto: require("crypto").webcrypto,
    supabase: undefined,
    SUPABASE_CONFIG: undefined,
  },
  localStorage,
  sessionStorage,
  navigator: {},
  fetch: () => Promise.reject(new Error("no fetch in harness")),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  JSON,
  Promise,
  crypto: require("crypto").webcrypto,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], "utf8"), ctx, { filename: "app.js" });

const assert = require("assert");
let passed = 0;
function ok(cond, name) {
  if (!cond) throw new Error("FAIL: " + name);
  passed += 1;
  console.log("  ✓ " + name);
}

console.log("Test: isValidLobbyCode");
ok(ctx.isValidLobbyCode("ABC23") === true, "valid code ABC23");
ok(ctx.isValidLobbyCode("ABCDE") === true, "valid code ABCDE");
ok(ctx.isValidLobbyCode("abc23") === false, "lowercase rejected");
ok(ctx.isValidLobbyCode("ABC1") === false, "too short + forbidden char");
ok(ctx.isValidLobbyCode("ABCDE1") === false, "too long");
ok(ctx.isValidLobbyCode("O0I1L") === false, "ambiguous chars rejected");
ok(ctx.isValidLobbyCode(null) === false, "null rejected");
ok(ctx.isValidLobbyCode("---") === false, "symbols rejected");

console.log("Test: computeRoleCounts");
const counts = ctx.computeRoleCounts({
  impostorCount: 2,
  jesterCount: 1,
  jesterProbability: 25,
  jesterRandomEnabled: false,
  detectiveCount: 1,
  detectiveRandomEnabled: false,
  doppelgangerCount: 1,
  doppelgangerRandomEnabled: false,
});
assert.strictEqual(JSON.stringify(counts), JSON.stringify({ impostors: 2, jesters: 1, detectives: 1, doppelgangers: 1, total: 5 }));
passed += 1;
console.log("  ✓ deterministic counts match config");

console.log("Test: selectGameWord — difficulty modes");
const testDecks = {
  easy: [{ word: "E1", clues: [] }],
  medium: [{ word: "M1", clues: [] }],
  hard: [{ word: "H1", clues: [] }],
  veryHard: [{ word: "V1", clues: [] }],
};
const testFullDeck = Object.values(testDecks).flat();

// Nur ein Level (Checkbox aus): ausschließlich der gewählte Grad.
const singleWords = new Set();
for (let i = 0; i < 30; i += 1) {
  singleWords.add(ctx.selectGameWord({ settings: { difficulty: "hard" }, deckByDifficulty: testDecks, wordDeck: testFullDeck }).word);
}
ok(singleWords.size === 1 && singleWords.has("H1"), "single-level mode draws ONLY from the chosen level");

// Als Maximum (Checkbox an): gewählter Grad ODER darunter, nie darüber.
const maxWords = new Set();
for (let i = 0; i < 60; i += 1) {
  maxWords.add(ctx.selectGameWord({ settings: { difficulty: "hard", difficultyMaxEnabled: true }, deckByDifficulty: testDecks, wordDeck: testFullDeck }).word);
}
ok(!maxWords.has("V1"), "max mode never draws above the chosen level");
ok(maxWords.has("H1") && maxWords.has("M1") && maxWords.has("E1"), "max mode draws from chosen level and below");
ok(maxWords.size === 3, "max mode pool == all levels up to chosen level");

// "Zufällig" bleibt unabhängig von der Checkbox das gesamte Deck.
const randomWords = new Set();
for (let i = 0; i < 60; i += 1) {
  randomWords.add(ctx.selectGameWord({ settings: { difficulty: "random", difficultyMaxEnabled: true }, deckByDifficulty: testDecks, wordDeck: testFullDeck }).word);
}
ok(randomWords.size === 4, "random mode still draws from the whole deck");

console.log("Test: createGameRound — shared impostor clues per rules");
const players = [
  { id: "p1", name: "A" }, { id: "p2", name: "B" }, { id: "p3", name: "C" },
  { id: "p4", name: "D" }, { id: "p5", name: "E" }, { id: "p6", name: "F" },
];
const settings = {
  impostorCount: 3,
  jesterCount: 0,
  detectiveCount: 0,
  doppelgangerCount: 0,
  itemsPerDetective: 1,
  difficulty: "easy",
};
const counts2 = ctx.computeRoleCounts(settings);
const round = ctx.createGameRound(players, settings, counts2);
ok(round.impostors.length === 3, "3 impostors assigned");
const clueSets = new Set(round.impostors.map((id) => round.impostorClues[id]));
ok(clueSets.size === 1, "ALL impostors see the IDENTICAL clue set");
const nClues = round.impostorClues[round.impostors[0]].split(", ").length;
ok(nClues === 3, `clue count == impostor count (got ${nClues})`);
ok(round.word === "Baum", "fallback deck word used (Baum)");

console.log("Test: createGameRound — too few players");
assert.throws(() => ctx.createGameRound([players[0], players[1], players[2]], settings, counts2), /Nicht genügend/);
passed += 1;
console.log("  ✓ throws when below minimum");

console.log("Test: buildRolePayloads — per-player secrecy");
const mixedSettings = {
  impostorCount: 1, jesterCount: 1, detectiveCount: 1, doppelgangerCount: 1,
  itemsPerDetective: 1, difficulty: "easy",
};
const mixedCounts = ctx.computeRoleCounts({
  impostorCount: 1, jesterCount: 1, detectiveCount: 1, doppelgangerCount: 1,
  itemsPerDetective: 1, jesterRandomEnabled: false, detectiveRandomEnabled: false, doppelgangerRandomEnabled: false,
});
const round2 = ctx.createGameRound(players.slice(0, 6), mixedSettings, mixedCounts);
const payloads = ctx.buildRolePayloads(round2, players.slice(0, 6), mixedSettings);
const byRole = {};
for (const [pid, p] of Object.entries(payloads)) byRole[p.key] = p;
ok(Object.keys(byRole).length === 5, "one payload per role kind");
ok(!byRole.impostor.message.includes(round2.word), "impostor payload does NOT contain the word");
ok(byRole.impostor.message.includes("Hilfswörter"), "impostor payload has clue list");
ok(byRole.player.message.includes("Gesuchtes Wort: " + round2.word), "normal player sees the word");
ok(byRole.jester.message.includes("rausvoten"), "jester sees goal + word");
ok(byRole.detective.message.includes("Deine Items"), "detective sees items");
  ok(!byRole.detective.message.includes("Item-Pool ("), "detective does not see the duplicate item pool");
  ok(byRole.player.message.includes("Detektiv-Item-Pool"), "other roles retain the shared item pool");
const detectiveId = round2.detectives[0];
round2.detectiveItemsMap[detectiveId] = ["🚫 Extra-Wort: Der DT bestimmt ein zusätzliches verbotenes Wort."];
const gatedPayload = ctx.buildRolePayloads(round2, players.slice(0, 6), mixedSettings)[detectiveId];
ok(gatedPayload.canSendDetectiveMessage, "Extra-Wort enables the detective message");
round2.detectiveItemsMap[detectiveId] = ["⚖️ Zwangsvote: Der DT erzwingt sofort eine Abstimmung."];
const ungatedPayload = ctx.buildRolePayloads(round2, players.slice(0, 6), mixedSettings)[detectiveId];
ok(!ungatedPayload.canSendDetectiveMessage, "other items do not enable the detective message");
ok(!byRole.doppelganger.message.includes(round2.word), "doppelganger sees nothing secret");
ok(!byRole.doppelganger.message.includes("Impostoren:"), "doppelganger gets no shared meta");

console.log("Test: role card section order");
const playerSections = ctx.getRoleCardSections(byRole.player);
ok(playerSections.focus[0].label === "Gesuchtes Wort" && playerSections.focus[0].value === round2.word, "word is the first role detail");
ok(playerSections.roles.some((line) => line.startsWith("Detektiv:")), "roles are grouped after the word");
ok(playerSections.items.length > 0, "detective item pool is the final role section");
const impostorSections = ctx.getRoleCardSections(byRole.impostor);
ok(impostorSections.focus[0].label === "Deine Hilfswörter", "impostor clues are shown as the first role detail");

  console.log("Test: game panel routine status");
  vm.runInContext('state.roundIdFromServer = "active-round"; state.statusMessage = "";', ctx);
  ctx.renderRoundSummary();
  ok(documentStub.getElementById("round-status").textContent === "", "routine round status is hidden");

  console.log("Test: detective message visibility");
  const detectiveMessage = "Geheime Nachricht";
  for (const role of ["detective", "jester", "player"]) {
    ok(ctx.getDetectiveMessageForRole(detectiveMessage, role) === detectiveMessage, `${role} sees the message`);
  }
  for (const role of ["impostor", "doppelganger"]) {
    ok(ctx.getDetectiveMessageForRole(detectiveMessage, role) === "████████████", `${role} sees only the redaction`);
  }

  async function testDetectiveMessageDelivery() {
    let latestMessage = { message: detectiveMessage };
    const latestMessageQuery = {
      select() { return this; },
      delete() { latestMessage = null; return this; },
      eq() { return this; },
      order() { return this; },
      limit() { return this; },
      async maybeSingle() { return { data: latestMessage, error: null }; },
    };
    ctx.mockSupabase = { from: () => latestMessageQuery };
    vm.runInContext('supabaseReady = true; state.lobbyCode = "ABC23"; supabaseClient = mockSupabase;', ctx);
    await ctx.loadLatestDetectiveMessage();
    ok(vm.runInContext("state.detectiveMessage", ctx) === detectiveMessage, "database poll delivers the latest message");
    latestMessage = null;
    await ctx.loadLatestDetectiveMessage();
    ok(vm.runInContext('state.detectiveMessage === ""', ctx), "database poll clears a removed message");
    latestMessage = { message: detectiveMessage };
    await ctx.loadLatestDetectiveMessage();
    ok(await ctx.clearDetectiveMessages(), "new round deletes old detective messages");
    ok(vm.runInContext('state.detectiveMessage === ""', ctx), "deleted round message is cleared in memory");
    vm.runInContext('supabaseReady = false; supabaseClient = null; state.lobbyCode = null;', ctx);
  }

  console.log("Test: detective editor focus");
  const editor = documentStub.getElementById("detective-message-input");
  editor.value = "Nachricht weiter schreiben";
  editor.selectionStart = 12;
  editor.selectionEnd = 12;
  editor.selectionDirection = "none";
  documentStub.activeElement = editor;
  vm.runInContext(`state.currentPlayerId = ${JSON.stringify(detectiveId)}; state.players = ${JSON.stringify(players)}; state.rolePayload = ${JSON.stringify(gatedPayload)}; state.round = null; state.detectiveMessage = "";`, ctx);
  ctx.renderPrivateRoleCard();
  ok(documentStub.activeElement === editor, "re-render keeps the detective editor focused");
  ok(editor.selectionStart === 12 && editor.selectionEnd === 12, "re-render preserves the text cursor");
  vm.runInContext(`state.rolePayload = ${JSON.stringify(ungatedPayload)};`, ctx);
  ctx.renderPrivateRoleCard();
  ok(!documentStub.getElementById("private-role-card").innerHTML.includes("detective-message-editor"), "editor is hidden without Extra-Wort");

async function testOnlineOnlyPlay() {
  console.log("Test: online-only play");
  ok(await ctx.syncToSupabase() === false, "Supabase sync is unavailable without a connection");
  const originalConsoleError = ctx.console.error;
  ctx.console.error = () => {};
  try {
    await ctx.handleStartGame();
  } finally {
    ctx.console.error = originalConsoleError;
  }
  ok(vm.runInContext("state.round", ctx) === null, "a round cannot start without Supabase");
  console.log(`\nALL ${passed} TESTS PASSED`);
}

async function runAsyncTests() {
  await testDetectiveMessageDelivery();
  await testOnlineOnlyPlay();
}

runAsyncTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});