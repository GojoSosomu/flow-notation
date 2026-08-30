// ============================================================
// Theorem 5 corollary test: demotion from Interface Layer to
// sub-layer, when a public function has weight=0 externally
// but is still needed internally.
// ============================================================

// BEFORE: isNumeric is public (Machine+isNumeric), but nothing
// outside Machine ever calls it directly -- weight = 0 externally,
// even though Machine's own run() uses it internally.
class MachineBefore {
  isNumeric(x) { return typeof x === "number"; } // PUBLIC, unused externally
  #log(msg) { console.log("[log]", msg); }
  run(input) {
    if (!this.isNumeric(input)) throw new Error("bad");
    this.#log("ok");
    return input * 2;
  }
}

// AFTER: isNumeric demoted to a sub-layer (Machine_isNumeric),
// per Theorem 5's corollary -- since external weight was 0,
// but internal usage remained, demotion (not deletion) is correct.
class MachineAfter {
  #isNumeric(x) { return typeof x === "number"; } // DEMOTED
  #log(msg) { console.log("[log]", msg); }
  run(input) {
    if (!this.#isNumeric(input)) throw new Error("bad");
    this.#log("ok");
    return input * 2;
  }
}

console.log("--- Before demotion ---");
const mb = new MachineBefore();
console.log("run(5):", mb.run(5));
console.log("isNumeric externally callable:", typeof mb.isNumeric === "function");

console.log("\n--- After demotion ---");
const ma = new MachineAfter();
console.log("run(5):", ma.run(5));
console.log("isNumeric externally callable:", typeof ma.isNumeric === "function");
// Behavior is identical; only the contract's shape changed.