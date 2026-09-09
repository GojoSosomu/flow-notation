class A {
  constructor(b) {
    this.b = b;
  }
  doSomething(value) {
    return this.b.helper(value) + 1;
  }
}

class B {
  constructor(a) {
    this.a = a;
  }
  helper(value) {
    return this.a.doSomething(value) * 2;
  }
}

// The actual construction problem: A needs a B to exist first,
// B needs an A to exist first. Neither can be built before the other.
try {
  const a = new A(undefined);
  const b = new B(a);
  a.b = b; // patch the reference AFTER both exist -- this is the
           // only way to actually wire a real 2-cycle at construction time
  console.log("Wiring succeeded via post-construction patch.");
  console.log("Calling a.doSomething(5):", a.doSomething(5));
} catch (e) {
  console.log("Construction failed:", e.message);
}