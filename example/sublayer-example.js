// ============================================================
// Simple Composition example.
// Machine is a Node. Inside it: sub-layers doing internal work.
// Machine_validate and Machine_log are NOT graph participants —
// they are Machine's internal structure (A_B), per the
// Composition rule: no external Node may target them directly.
// ============================================================

class Machine {
  // --- sub-layer: Machine_validate ---
  #validate(input) {
    if (typeof input !== "number") {
      throw new Error("Machine requires numeric input");
    }
    return true;
  }

  // --- sub-layer: Machine_log ---
  #log(message) {
    console.log(`[Machine] ${message}`);
  }

  // --- Machine's actual contract (the only legal entry point) ---
  run(input) {
    this.#validate(input);      // Machine_run -> Machine_validate (internal edge)
    this.#log(`running with ${input}`);  // Machine_run -> Machine_log (internal edge)
    return input * 2;
  }
}

// --- external usage ---
const machine = new Machine();
console.log("Result:", machine.run(21));

// This is illegal / impossible by construction — there is no
// legal way for external code to reach #validate or #log
// directly. JS private fields (#) enforce this at the language
// level, which is a nice literal match for Composition's rule:
//
// machine.#validate(5);   // SyntaxError / not accessible from outside class body