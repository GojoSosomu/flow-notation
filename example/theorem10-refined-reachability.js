// ============================================================
// Theorem 10, refined: recursive reachability R(X), correctly
// handling convergence points (a node reached by more than one
// parent), which the original single-path product could not.
//
// Graph: A->B->C->D->E, A->F->G->D, A->H->I->C
// Convergence points: D has parents {C, G}, C has parents {B, I}
// ============================================================

const edges = {
  "A->B": 0.9,  "B->C": 0.7,  "C->D": 0.6,  "D->E": 0.8,
  "A->F": 0.85, "F->G": 0.75, "G->D": 0.65,
  "A->H": 0.9,  "H->I": 0.8,  "I->C": 0.7,
};

// children[x] = [[y, p], ...] where x depends on y (x -> y)
const children = {};
for (const [key, p] of Object.entries(edges)) {
  const [x, y] = key.split("->");
  if (!children[x]) children[x] = [];
  children[x].push([y, p]);
}

// R(x, origin) = probability a change at `origin` reaches `x`,
// via the corrected OR-combination over all of x's dependencies.
function reach(x, origin, memo = {}) {
  if (x === origin) return 1.0;
  if (x in memo) return memo[x];
  const kids = children[x] || [];
  if (kids.length === 0) {
    memo[x] = 0.0;
    return 0.0;
  }
  let prodFail = 1.0;
  for (const [y, p] of kids) {
    prodFail *= 1 - p * reach(y, origin, memo);
  }
  memo[x] = 1 - prodFail;
  return memo[x];
}

console.log("R(A) with E as origin:", reach("A", "E").toFixed(4));
console.log("R(A) with D as origin:", reach("A", "D").toFixed(4));
console.log("R(A) with C as origin:", reach("A", "C").toFixed(4));
console.log();

// in A's descendant subgraph (weight=1 for each, for simplicity).
const allNodes = ["B", "C", "D", "E", "F", "G", "H", "I"];
let total = 0;
for (const n of allNodes) {
  total += 1 * reach("A", n);
}
console.log("TotalExposure(A) across entire subgraph:", total.toFixed(4));