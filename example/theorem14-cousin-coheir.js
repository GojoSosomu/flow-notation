// ============================================================
// Theorem 14: Cousin/Co-heir Disjointness and Scope
//
// Graph: A->B->C, A->D->E->C
// ============================================================

const edges = [["A","B"],["B","C"],["A","D"],["D","E"],["E","C"]];
const dependents = {};
const children = {};
for (const [x,y] of edges) {
  (dependents[y] ??= new Set()).add(x);
  (children[x] ??= new Set()).add(y);
}

function up(x, seen = new Set()) {
  for (const d of dependents[x] || []) {
    if (!seen.has(d)) { seen.add(d); up(d, seen); }
  }
  return seen;
}
function down(x, seen = new Set()) {
  for (const c of children[x] || []) {
    if (!seen.has(c)) { seen.add(c); down(c, seen); }
  }
  return seen;
}
function cousin(x, y) {
  const ux = up(x), uy = up(y);
  return [...ux].filter(n => uy.has(n));
}
function coheir(x, y) {
  const dx = down(x), dy = down(y);
  return [...dx].filter(n => dy.has(n));
}

console.log("--- Test 1: disjointness, on a real pair (B, D) ---");
console.log("Cousin(B,D):", cousin("B","D"));
console.log("CoHeir(B,D):", coheir("B","D"));

console.log("\n--- Test 2: Peer degenerate case ---");
console.log("up(A) [A is Peer]:", [...up("A")]);
console.log("Cousin(A, C) must be empty since up(A) is empty:", cousin("A","C"));

console.log("\n--- Test 3: scope boundary -- direct connection not captured ---");
console.log("Cousin(A,C):", cousin("A","C"));
console.log("CoHeir(A,C):", coheir("A","C"));
console.log("(A and C ARE directly connected via 2 real paths, yet both empty)");