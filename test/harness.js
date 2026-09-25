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
ok(!byRole.doppelganger.message.includes(round2.word), "doppelganger sees nothing secret");
ok(!byRole.doppelganger.message.includes("Impostoren:"), "doppelganger gets no shared meta");

console.log(`\nALL ${passed} TESTS PASSED`);