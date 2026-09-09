class A {
  constructor(b) { this.b = b; }
  start(value) { return this.b.step(value); }
}
class B {
  constructor(c) { this.c = c; }
  step(value) { return this.c.finish(value); }
}
class C {
  constructor(a) { this.a = a; }
  finish(value) { return this.a.start(value + 1); } // NO base case
}

try {
  const a = new A(undefined);
  const b = new B(undefined);
  const c = new C(a);
  a.b = b;
  b.c = c;
  console.log(a.start(1));
} catch (e) {
  console.log("Confirmed crash:", e.message);
}