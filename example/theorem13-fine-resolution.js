// ============================================================
// Does A->B, B->A dissolve at the Interface Layer level
// if the actual calls are do -> something -> finalize, with
// finalize NOT calling back into do or something?
// ============================================================

class A {
  do(value) {
    return this.b.something(value); // A+do -> B+something
  }
  finalize(value) {
    return value * 10; // A+finalize does NOT call back into B at all
  }
  constructor(b) { this.b = b; }
}

class B {
  something(value) {
    return this.a.finalize(value + 1); // B+something -> A+finalize
  }
  constructor(a) { this.a = a; }
}

const a = new A(undefined);
const b = new B(a);
a.b = b;

console.log("a.do(5):", a.do(5));
// Check: does calling do() ever loop back to do() or something()
// a second time? Or does it terminate cleanly after finalize()?