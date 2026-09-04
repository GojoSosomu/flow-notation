// ============================================================
// Confirms four new/refined relations on a real convergent
// graph: Barren (~X = empty), and the full transitive closures
// Ancestor (^X) and Descendant (vX).
//
// Graph: A->B->C->D, A->F->G->D
// ============================================================

const edges = [
  ["A", "B"], ["B", "C"], ["C", "D"],
  ["A", "F"], ["F", "G"], ["G", "D"],
];

const dependents = {}; // who depends on X directly (one hop up)
const children = {};   // what X depends on directly (one hop down)
for (const [x, y] of edges) {
  (dependents[y] ??= new Set()).add(x);
  (children[x] ??= new Set()).add(y);
}

const allNodes = new Set(edges.flat());

function upClosure(x, seen = new Set()) {
  for (const d of dependents[x] || []) {
    if (!seen.has(d)) { seen.add(d); upClosure(d, seen); }
  }
  return seen;
}

function downClosure(x, seen = new Set()) {
  for (const c of children[x] || []) {
    if (!seen.has(c)) { seen.add(c); downClosure(c, seen); }
  }
  return seen;
}

console.log("--- Peer check (^X empty) ---");
for (const n of [...allNodes].sort()) {
  if (!dependents[n] || dependents[n].size === 0) console.log(`${n} is Peer`);
}

console.log("\n--- Barren check (~X empty) ---");
for (const n of [...allNodes].sort()) {
  if (!children[n] || children[n].size === 0) console.log(`${n} is Barren`);
}

console.log("\n--- Ancestor closure: ↑D ---");
console.log([...upClosure("D")].sort());

console.log("\n--- Descendant closure: ↓A ---");
console.log([...downClosure("A")].sort());