// ============================================================
// Theorem 8 test: does Composition recurse? Can a sub-layer
// have its own sub-layer?
// ============================================================

// --- FIRST ATTEMPT (fails to prove the claim) ---
// Flat private methods on the same class are NOT truly nested —
// Machine's own code can skip past #validate to reach #isNumeric.
class MachineFlat {
  #isNumeric(x) { return typeof x === "number"; }
  #validate(input) {
    if (!this.#isNumeric(input)) throw new Error("bad input");
    return true;
  }
  #log(msg) { console.log("[log]", msg); }

  run(input) {
    this.#validate(input);
    this.#log("ok");
    return input * 2;
  }

  // Machine itself skipping past #validate to reach #isNumeric directly.
  // This SUCCEEDS — proving flat private methods don't enforce nesting.
  testSkip(input) {
    return this.#isNumeric(input);
  }
}

console.log("--- Flat private methods (does NOT enforce depth-2 nesting) ---");
const mf = new MachineFlat();
console.log("normal run:", mf.run(5));
console.log("skip call (succeeds, which is the problem):", mf.testSkip(5));


// --- CORRECTED TEST (proves the claim) ---
// Validate is now its own class with its own private state —
// a genuine second black box, not a flat method.
class Validate {
  #isNumeric(x) { return typeof x === "number"; }
  check(input) {
    if (!this.#isNumeric(input)) throw new Error("bad input");
    return true;
  }
}

class Machine {
  #validate = new Validate();
  #log(msg) { console.log("[log]", msg); }

  run(input) {
    this.#validate.check(input);   // the only legal entry point
    this.#log("ok");
    return input * 2;
  }
}

console.log("\n--- Nested class-in-class (correctly enforces depth-2 nesting) ---");
const m = new Machine();
console.log("normal run:", m.run(5));
try {
  m.run("nope");
} catch (e) {
  console.log("caught bad input:", e.message);
}

// The skip attempt below fails to even PARSE — not just to run.
// Uncommenting it breaks this entire file at load time, which is
// itself strong evidence for Theorem 8: the illegal edge isn't just
// rejected at runtime, it's rejected as not well-formed at all.
//
// class MachineSkip extends Machine {
//   testSkip(input) {
//     return this.#validate.#isNumeric(input);
//     // SyntaxError: Private field '#isNumeric' must be declared in an enclosing class
//   }
// }


// ============================================================
// STRONGEST FORM: Validate as a truly private inner class —
// not just a private instance of a separate top-level class,
// but a class definition that never exists as a nameable thing
// outside Machine at all.
// ============================================================

class MachineStrict {
  static #ValidateClass = class {
    #isNumeric(x) { return typeof x === "number"; }
    check(input) {
      if (!this.#isNumeric(input)) throw new Error("bad input");
      return true;
    }
  };

  #validate = new MachineStrict.#ValidateClass();

  run(input) {
    this.#validate.check(input);
    return input * 2;
  }
}

console.log("\n--- Private inner class (strongest form of Composition) ---");
const ms = new MachineStrict();
console.log("run:", ms.run(5));
try { ms.run("nope"); } catch (e) { console.log("caught:", e.message); }
// Note: checking `typeof Validate` here would incorrectly test the
// EARLIER top-level `class Validate` declared above in this same file
// (from the previous test section) — that class is unrelated to
// MachineStrict and its existence doesn't compromise this test at all.
// The correct check is whether #ValidateClass's name leaks anywhere
// outside MachineStrict — it doesn't; there is no global or module-level
// binding for it under any name, which is the actual claim being tested.
console.log("MachineStrict has no externally nameable inner class — confirmed by construction: #ValidateClass is a private static field, never bound to any name outside the class body.");