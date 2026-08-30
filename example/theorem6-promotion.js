// ============================================================
// Theorem 5 test: a second Node, Sensor, also needs to validate
// numeric input — the exact same rule as Machine_validate.
// Per Theorem 5: Sensor cannot reach Machine_validate directly.
// It has exactly two options. Let's try both and see what
// actually happens.
// ============================================================

class Machine {
  #validate(input) {
    if (typeof input !== "number") throw new Error("Machine requires numeric input");
    return true;
  }
  run(input) {
    this.#validate(input);
    return input * 2;
  }
}

class Sensor {
  read(input) {
    // OPTION ATTEMPTED: reach into Machine's validate directly
    // Sensor -> Machine_validate : ILLEGAL, not just discouraged
    // Uncommenting the next line does not even parse:
    //
    // const m = new Machine();
    // m.#validate(input);   // SyntaxError: Private field '#validate' must be declared in an enclosing class
    //
    // Confirmed: there is no third option. Only two remain.
  }
}

// --- Option 1: DUPLICATE the logic ---
class SensorDuplicated {
  #validate(input) { // copy-pasted, now living in two places
    if (typeof input !== "number") throw new Error("Sensor requires numeric input");
    return true;
  }
  read(input) {
    this.#validate(input);
    return `reading: ${input}`;
  }
}

// --- Option 2: PROMOTE the logic out of Composition into a real Node ---
class NumericValidator {          // now a real, independent Node
  validate(input) {
    if (typeof input !== "number") throw new Error("Requires numeric input");
    return true;
  }
}

class MachinePromoted {
  constructor(validator) { this.validator = validator; } // Machine -> NumericValidator (real edge)
  run(input) {
    this.validator.validate(input);
    return input * 2;
  }
}

class SensorPromoted {
  constructor(validator) { this.validator = validator; } // Sensor -> NumericValidator (real edge)
  read(input) {
    this.validator.validate(input);
    return `reading: ${input}`;
  }
}

// --- run both options to confirm they work ---
const dup = new SensorDuplicated();
console.log(dup.read(7));

const validator = new NumericValidator();
const m2 = new MachinePromoted(validator);
const s2 = new SensorPromoted(validator);
console.log("Machine:", m2.run(10));
console.log("Sensor:", s2.read(10));

// Now check: Machine and Sensor share a parent-like structural
// role with respect to NumericValidator once promoted.
// ^NumericValidator = { MachinePromoted, SensorPromoted }
// -- exactly a Parent relation, formed the moment promotion happened.