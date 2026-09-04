# Flow Notation

**Author:** Chemuel Jhon L. Dela Peña
**© 2026 Chemuel Jhon L. Dela Peña. Licensed under CC BY 4.0.**

You are free to use, share, adapt, teach, implement, or build tools based
on Flow Notation — for any purpose, commercial or otherwise — **provided
that Chemuel Jhon L. Dela Peña is credited as the originator of Flow
Notation** wherever the name, the axioms, the theorems, or the underlying
methodology are used, referenced, or built upon.

**Suggested citation:**
> Dela Peña, Chemuel Jhon L. *Flow Notation.* 2026.

Full license text: https://creativecommons.org/licenses/by/4.0/

---

## Table of Contents

- [0. Methodology — "Rename, Recalibrate, Readjust"](#0-methodology--rename-recalibrate-readjust)
- [1. Primitives](#1-primitives)
- [2. Axioms](#2-axioms)
- [3. Relations](#3-relations)
- [4. Worked examples](#4-worked-examples)
- [5. The Dependency Test (summary)](#5-the-dependency-test-summary)
- [6. Sibling as a Refactoring Invariant](#6-sibling-as-a-refactoring-invariant)
- [7. Theorems](#7-theorems) (11 theorems, each proven and empirically tested)
- [8. Beyond the Axioms — Applied Models](#8-beyond-the-axioms--applied-models) (not proven; kept structurally separate from §7)
  - [8.1 Analogy — The Load Path](#81-analogy--the-load-path)
  - [8.2 Beyond the Model](#82-beyond-the-model)
  - [8.3 Implications of Flow Notation, as of now](#83-implications-of-flow-notation-as-of-now)
- [Code examples](#code-examples)

**Code examples referenced throughout this document** are included
alongside this file — each one was written and run to test a specific
claim before that claim was accepted into the text; none are illustrative
only.

---

**Definition.** Flow Notation is a method for modeling software as a graph
of black-box responsibilities (Layers), where edges represent verified
dependency — checked against each Layer's stated responsibility via the
Dependency Test — constrained by three Axioms governing direction, depth,
and fan-out. The provable consequences of holding all three Axioms at once
(Shielding, Sibling/Parent Independence, quantified exposure, and more)
give the graph predictive and diagnostic power beyond what the Axioms alone
state.

A system for modeling dependency architecture in software: how responsibilities
connect, how tightly they should connect, and how to name/verify the connections
before trusting them.

**A note on Axiom vs. Theorem vs. Relation**, since the three are easy to
blur: **Axioms** (§2) are stipulated — they define what Flow Notation *is*,
not something derived from anything more basic. **Relations** (§3) are
descriptive vocabulary for shapes the graph can take; they carry no
obligations of their own. **Theorems** (§7) are claims *proven* from the
Axioms — they are not additional rules, they are guaranteed consequences.
Nothing in §7 could be false while the Axioms hold; that's what makes them
theorems rather than more design guidance.

---

## 0. Methodology — "Rename, Recalibrate, Readjust"

Applied **before** any edge is drawn, and re-applied whenever a Node's
responsibility or an edge is in doubt.

1. **Rename** — State each Node's responsibility as one precise sentence.
   If the name is vague (e.g. "Manager", "Handler", "Setup", "Main"), rename
   it until the sentence is unambiguous. A Node's name should be precise
   enough that its responsibility can be read directly off the name, not
   inferred by guessing.

2. **Recalibrate** — Test every proposed edge with the **Dependency Test**:

   > Does A's responsibility sentence become false, incomplete, or
   > meaningless without B — or does A merely happen to hold/pass/contain
   > B as incidental content?

   - Breaks without `B` → real dependency → `A→B` is a true edge.
   - Survives fine (just empty/generic) without B → **no edge** — B was
     decorative, not structural.

   Note: a dependency is on *what's required*, not on *what happens to pass
   through*. A Node that only receives a plain value (not a live reference to
   another Node) may not depend on the Node that produced that value — see
   the Story Runner case below.

3. **Readjust** — After correcting names and pruning decorative edges,
   re-check the whole graph against Axioms 1–3 (below). Corrections at this
   stage can resolve — or reveal — axiom violations that weren't visible
   before the responsibility sentences were made precise.

---

## 1. Primitives

- **Node** — a Layer: a unit with a well-defined responsibility, which may
  or may not be independently usable.

  **The Black-Box Property.** A well-defined responsibility is inherently a
  contract stated in terms of input and output, never in terms of internal
  mechanism. This is not a separate rule bolted onto Node — it is what
  "well-defined responsibility" *means*: to depend on `A` is to trust that
  `A`'s output is consistent given its input, never to see or rely on how
  `A` produces that output. Every Node is therefore a black box to
  everything outside it, by definition, not by access-control convention.

  This single property is the shared root of two things that otherwise look
  like separate rules:
  - **Axiom 2** (no skip-level access) is the black-box property applied
    *between* Nodes: `A` may depend on `B` and trust `B`'s output, but `A`
    may never reach past `B` to see how `B` produced it (i.e. into `C`,
    `B`'s own dependency).
  - **Composition** (below) is the black-box property applied *inside* a
    single Node: whatever internal parts a Node is made of are exactly as
    unreachable from the outside as `C` was to `A` above — for the same
    reason, not a different one.

- **Edge (`A→B`)** — "`A` depends on `B`." Tail = the dependent, head = the
  dependency. `A→B` means `A` cannot fulfill its responsibility without
  `B`'s support.
- **`D(A)`** — the direct dependency set of `A`: `{ X : A→X }`.
- **`Δ(D)`** — the direct dependent set of `D`: `{ X : X→D }` (the reverse
  of `D`).
- **`C(A)`** — the **Contract** of `A`: the set of all Interface Layer
  members `A` exposes for others to depend on, `C(A) = { A+f1, A+f2, ... }`
  (see Interface Layer, below). An edge `X→A` is well-formed only if it
  targets something in `C(A)` — a sub-layer `A_B` is never a member of
  `C(A)`, by the Black-Box Property above. Where earlier sections say "`A`'s
  contract" informally, `C(A)` is the formal object being referred to.
- **`U(X,A)`** — the subset of `C(A)` that `X` actually uses:
  `U(X,A) ⊆ C(A)`. Most edges `X→A` only exercise part of `C(A)`, not all
  of it. A change to `C(A) \ U(X,A)` does not affect `X`; a change to any
  member of `U(X,A)` does. This is the basis for Theorem 5's weighting.
- **`∅`** — not a node; a marker meaning "no real parent" (empty/null).
  Used to mark top-level Nodes: `A ∈ D(∅)` means nothing depends on `A`
  being someone else's child — `A` is a root.
- **`A_B`** — **Composition**, not a graph edge. Read as "`B` is the
  internal structure of `A`." Describes what `A` is made of (e.g.
  `Machine_validate`, `Machine_log`), invisible from outside `A` because of
  the Black-Box Property above — not because of whatever language
  mechanism happens to enforce it. Composition is a different axis
  entirely from dependency:
  - The outer graph only ever sees **`A`** as a black box (its `D(A)` and
    `Δ(A)`). This was already true the moment `A` was called a Layer with
    a well-defined responsibility; a sub-layer `A_B` is simply what's
    found when that box is opened for `A`'s own construction, not for
    anyone else's consumption.
  - Internally, `A`'s sub-layers (`A_x`, `A_y`, ...) can form their **own**
    Flow Notation graph, governed by the same three Axioms, scoped
    entirely inside `A`.
  - `A_B → A` is not merely forbidden, it is not well-formed — `A_B` is a
    label naming `A`'s internals, not a Node that can participate in an
    edge with `A` itself.
  - No external Node may target a sub-layer directly (`X → A_B` is
    illegal) — only `X → A` is legal. This is the Black-Box Property
    stated once more, one level deeper: `A_B` was never exposed as
    something depend-able-on from outside `A`, because exposing it would
    mean the outside can see inside the box, which is precisely what a
    Layer's contract exists to prevent. Private fields, closures, module
    scope, or any other language mechanism used to enforce this are
    implementation details of the enforcement — not the reason the
    property holds. The reason is that `A_B` was never meant to be
    addressable the moment `A` was defined as a Layer at all.

- **`A+f`** — **Interface Layer**, a third primitive distinct from both
  Node and sub-layer. Read as "`f` is a member of `A`'s Interface Layer" —
  i.e. `f ∈ C(A)`. An Interface Layer member is a genuine hybrid, and this
  is precisely why it cannot be classified as a sub-layer despite sitting
  inside `A`'s definition:
  - **Reachable, unlike a sub-layer.** `A+f` is exactly what a real edge
    `X→A` is permitted to target — it is the boundary itself, the one
    part of `A`'s insides that is allowed to show. A sub-layer `A_B` is,
    by contrast, never a legal edge target (Black-Box Property).
  - **Not subject to Theorem 6's Duplicate-or-Promote dilemma.** A
    sub-layer needing external reuse must be duplicated or promoted into a
    real Node. An Interface Layer member has no such dilemma — it is
    already the external-facing thing; nothing about it needs promoting.
  - **May still depend on sub-layers internally.** `A+f`'s
    *implementation* can hold real internal edges into `A`'s sub-layers —
    e.g. `A+run → A_validate`, `A+run → A_log` — without those sub-layers
    ever leaking through `A+f`'s own name or signature. This is the
    resolution to an earlier open question: `C(A)` as a *set* does not
    itself hold dependencies (a set cannot depend on anything); rather,
    each *individual member* `A+f` may depend on `A`'s sub-layers, and
    this dependency is entirely internal to `A`, invisible from outside
    exactly as any other composition edge is.
  - Confirmed empirically: enumerating a real class's visible members
    (`Object.getOwnPropertyNames`) shows only Interface Layer members
    (e.g. `run`) — sub-layers (`#validate`, `#log`) do not appear at all,
    by any name, even though `run`'s own implementation depends on both.

  Because the black-box property is symmetric between "between Nodes" and
  "inside a Node," Layer and sub-layer are not a primary structure with a
  secondary add-on — they are the **same single idea (a black box with a
  contract) applied at two scales**, exactly as much load-bearing at one
  scale as the other. See Theorem 6 (§7) for the proven consequence of this
  for reuse, and Theorem 5 for the mirrored minimality claim on `C(A)`.

---

## 2. Axioms

**Axiom 1 — Unidirectional Flow.**
Dependency must flow strictly downward. If `A→B`, then `B→A` can never also
hold, directly or transitively. No cycles.

**Axiom 2 — No Skip-Level Access.**
If `A→B→C`, `A` may not also hold a direct edge to `C`. To use `C`'s
functionality, `A` must go through `B`. Grandchildren are reached only via
the child, never bypassed.

**Axiom 3 — Local Minimal Fan-Out.**
For every Node `A`, `|D(A)|` must be reduced to the irreducible minimum
required for `A` to fulfill its stated responsibility. An edge `A→X`
survives only if `X` is not redundant, not mergeable into another
dependency, and not reachable transitively through an existing dependency.
Evaluated **per node**, independent of the rest of the graph.

These two properties fall directly out of the Axioms, not from separate
rules:

- **Shielding.** If `A→B→C` (Axiom 2 satisfied), `C`'s internal changes
  only affect `A` if they change `B`'s observable contract. `C`'s risk to
  `A` is *mediated* by `B`. Violating Axiom 2 (adding `A→C` directly)
  removes the shield — `C` becomes as directly risky to `A` as `B` is.
- **Bounded, deliberate risk.** Once `D(A)` is minimal (Axiom 3), `A`'s
  direct exposure is fixed at its floor. Any further addition to `D(A)` is
  now a visible, deliberate decision, not incidental sprawl.

---

## 3. Relations

Relations are **consequences** of the graph's shape under the Axioms — not
additional rules to enforce. They are descriptive vocabulary, not
prescriptive constraints.

**Sibling — `~A = D(A)`**
The Sibling set under `A`. Any two members share direct parent `A`
(converge from above). Symmetric; relative to the anchor `A`. The same pair
may be Sibling under one anchor and unrelated under another.

**Peer — `~∅`**
The degenerate case of Sibling where the anchor is `∅`. `~∅` is the set of
all top-level (root) Nodes — those in `D(∅)`. Any two members share *no*
parent and no coupling whatsoever; this holds regardless of whether they
later converge on a shared descendant downstream (Peer is blind to
downstream structure — it only asks about shared *parentage*).

**Parent — `^D = Δ(D)`**
The Parent set with respect to `D`. Any two (or more) members directly
depend on the same child `D` (converge from below) — the mirror image of
Sibling, opposite direction. Read `A^C` as "`A` is parent-*with* `C`"
(jointly parents of something), not "`A` is parent-of `C`."

**Barren — `~X = ∅`**
A Node with no dependencies of its own — `D(X) = ∅`, a true leaf. The
mirror image of Peer, across the opposite direction of the same axis: Peer
is the absence of structure *above* a single Node (`^X = ∅`, nothing
depends on it); Barren is the absence of structure *below* a single Node
(`~X = ∅`, it depends on nothing). Where Sibling and Parent describe
*shared* structure between two Nodes, Peer and Barren describe *absent*
structure for one Node alone. Confirmed distinct and non-overlapping on a
real convergent graph (`A→B→C→D`, `A→F→G→D`): `A` is the graph's only Peer
(`^A = ∅`), `D` is the graph's only Barren node (`~D = ∅`) — neither
condition implies or excludes the other in general, since a Node could in
principle be both (a fully isolated Node with no edges at all in either
direction) or neither (any interior Node of a longer chain).

**Ancestor — `↑X`**
The full upward transitive closure of `^`: `↑X = ^X ∪ ^(^X) ∪ ^(^(^X)) ∪
...`, every Node that depends on `X`, directly or indirectly, all the way
up to and including the roots in `~∅`. `^X` (Parent, one hop) is always a
subset of `↑X` — the first layer of the full ancestry, never the whole of
it. Termination is guaranteed for free by Axiom 1: an infinite ascent
would require a cycle, which cannot exist in a DAG. Confirmed on the same
convergent test graph: `↑D = {B, C, G, A, F}` — every Node that eventually,
through any path, depends on `D`.

**Descendant — `↓X`**
The mirror closure downward: `↓X = ~X ∪ ~(~X) ∪ ~(~(~X)) ∪ ...`, every
Node `X` depends on, directly or indirectly, terminating at Barren nodes
(leaves) rather than at `∅`. `~X` (Sibling, one hop) is always a subset of
`↓X`. This is precisely the set Theorem 10's `TotalExposure(A)` corollary
already sums `R(A←N)` over, informally described there as "every node in
A's descendant subgraph" — `↓A` is the formal name for that set. Confirmed
on the same test graph: `↓A = {B, G, C, D, F}`, matching exactly.

Notes on interaction between relations:

- Peer and Sibling are mutually exclusive for a given pair (Peer is the
  `∅`-case of Sibling — a pair is under a real anchor or under `∅`, never
  both).
- Peer and Parent are **not** mutually exclusive — they're orthogonal axes
  (shared-parent vs shared-child). E.g. `A→B`, `C→B` gives both `A ∈ ~∅` /
  `C ∈ ~∅` (if `A`, `C` are roots) **and** `A, C ∈ ^B` simultaneously.
- Parent only sees *direct* `Δ(D)` membership — an indirect ancestor of `D`
  (reachable via a longer path) is not a member of `^D`, exactly as Sibling
  only sees direct `D(A)` membership. Depth/distance does not leak into
  either relation.
- Barren is checked structurally, the same way Peer is — neither requires
  walking `↑X`/`↓X` to confirm; `~X = ∅` and `^X = ∅` are both direct,
  one-step facts. `↑X` and `↓X` exist for the separate question of *who
  else* lies along the full chain above or below a Node, not for
  determining Peer or Barren status itself.

---

## 4. Worked examples

**Disconnected roots:** `A→B`, `C→D` ⟹ `A, C ∈ ~∅` (Peer). Peer holds even
with zero shared structure anywhere in the graph — the simplest, cleanest
case.

**Convergent roots:** `A→B→C→D`, `E→D` ⟹ `A, E ∈ ~∅` (Peer, roots with no
shared parent) **and** `C, E ∈ ^D` (Parent, both directly feed D). Peer and
Parent coexist without contradiction — different axes.

**Symmetric diamond:** `A→B→D`, `A→C→D` ⟹ `~A = {B, C}` (Sibling) **and**
`^D = {B, C}` (Parent) — same pair, both relations, because the paths are
equal length. No Axiom 2 violation: A never touches D directly.

**Asymmetric diamond:** `A→B→D`, `A→C→E→D` ⟹ `~A = {B, C}`, but `^D =
{B, E}` — **`C` is excluded from `^D`** despite being an ancestor of `D`, because
C's edge terminates at E, not D. The two sets diverge once path lengths
differ; overlap in the symmetric case was coincidental, not structural.

**Story example (Rename/Recalibrate in action):**
Programs: Storyline (holds story data, exposes `getStoryline()`), Story
Runner (executes a story), Story Setup (prepares Storyline, retrieves data,
hands off to Runner).

Naive first pass suggested a triangle (`Setup→Storyline`, `Setup→Runner`,
`Runner→Storyline`) — which violates Axiom 2 (Setup reaches Storyline both
directly and via Runner).

Recalibrating against "Setup" taken literally — *prepare, then hand off* —
resolves it: Setup fetches the storyline value itself and passes the
*value* into Runner. Runner's responsibility ("run a story") is satisfied by
receiving data, not by holding a live dependency on the Storyline program.

Final: `StorySetup → StoryLine`, `StorySetup → StoryRunner`,
**no edge `Runner→Storyline`.** No skip-level, minimal fan-out satisfied,
`~StorySetup = {StoryLine, StoryRunner}`.

**Enrollment example (Dependency Test in action):**
Programs: Student (holds student data), StudentEnroller (validates
enrollment eligibility), StudentManager (holds the collection of enrolled
students), EnrollmentCoordinator (orchestrates: sends Student to Enroller,
then result to Manager).

Dependency Test applied to each candidate edge:

- `EnrollmentCoordinator → StudentEnroller` — Coordinator's responsibility
  is meaningless without Enroller. Real edge.
- `EnrollmentCoordinator → StudentManager` — same reasoning. Real edge.
- `StudentEnroller → Student` — "validates a Student's eligibility" is
  meaningless without a Student to evaluate. Real edge.
- `StudentManager → Student` — **rejected.** Manager's responsibility
  ("holds a collection of things") is still true, just empty, with zero
  Students. Student is incidental content, not a structural requirement.
  No edge.

Final: `EnrollmentCoordinator → StudentEnroller`,
`EnrollmentCoordinator → StudentManager`, `StudentEnroller → Student`.
`~EnrollmentCoordinator = {StudentEnroller, StudentManager}`. Clean, minimal,
no decorative edges, no skip-level.

---

## 5. The Dependency Test (summary)

The single mechanical question underlying every edge decision in this
document:

> **Does A's responsibility sentence become false, incomplete, or
> meaningless without B — or does A merely happen to hold, pass, or contain
> B as incidental content?**

Breaks without B → `A→B` is real. Survives (empty/generic) without B → no
edge. Passing a *value* produced by B is not the same as depending on B —
what matters is whether A's own definition collapses without B, not whether
B's output ever touched A.

---

## 6. Sibling as a Refactoring Invariant

**Claim:** if `A, B ∈ ~X` for some real X, then `A→B` and `B→A` must both be
false.

**Why it's forced, not conventional:** if A and B share direct parent X
(`X→A`, `X→B`), and an edge `A→B` also existed, that reconstructs
`X→A→B` — a path — **plus** the direct edge `X→B`. That is exactly the
skip-level shape Axiom 2 forbids. Sibling status structurally implies "no
direct edge between the pair" as an automatic consequence of Axiom 2, not
as a separate rule to remember.

### 6.1 Reference case — OrderProcessor / PaymentHandler / InventoryHandler

`OrderProcessor` orchestrates fulfilling an order: charge payment, confirm
stock. Both are genuinely necessary and neither is reachable through the
other, so:

```
OrderProcessor → PaymentHandler
OrderProcessor → InventoryHandler
~OrderProcessor = {PaymentHandler, InventoryHandler}   // Sibling, by definition
```

**Violation.** A refactor reveals PaymentHandler quietly holds a reference to
InventoryHandler and calls it before charging, to avoid billing for
out-of-stock items:

```js
class PaymentHandler {
  constructor(inventoryHandler) {
    this.inventoryHandler = inventoryHandler; // hidden edge: PaymentHandler -> InventoryHandler
  }
  charge(orderId, amount) {
    if (!this.inventoryHandler.hasStock(orderId)) {
      throw new Error("Cannot charge — out of stock");
    }
    console.log(`Charged $${amount} for order ${orderId}`);
  }
}
```

Graph now: `OrderProcessor→PaymentHandler`, `OrderProcessor→InventoryHandler`,
**`PaymentHandler→InventoryHandler`**. `OrderProcessor→PaymentHandler→InventoryHandler`
is a path, and `OrderProcessor→InventoryHandler` is also a direct edge —
the skip-level shape, forced into existence the moment an edge appeared
between two declared Siblings. This confirms the invariant is not a
convention but a structural consequence: Sibling (shared parent) plus any
edge between the pair always reconstructs the forbidden triangle.

**Fix.** Apply the Dependency Test to PaymentHandler: does "charge a
customer" require InventoryHandler to *exist*, or only a plain
stock-availability *value*? Only a value — so OrderProcessor checks stock
itself and passes the result in:

```js
class PaymentHandler {
  charge(orderId, amount, inStock) {   // plain boolean in, not a Node reference
    if (!inStock) {
      throw new Error("Cannot charge — out of stock");
    }
    console.log(`Charged $${amount} for order ${orderId}`);
  }
}

class OrderProcessor {
  process(orderId, amount) {
    const inStock = this.inventoryHandler.hasStock(orderId); // checked here, not delegated
    this.paymentHandler.charge(orderId, amount, inStock);    // value, not a Node reference
  }
}
```

`PaymentHandler→InventoryHandler` is deleted entirely. Sibling status is
restored — both versions produce identical runtime behavior, confirming the
fix costs nothing functionally while restoring the shielding guarantee:
changes to InventoryHandler's internals can no longer reach PaymentHandler
except through OrderProcessor's own contract.

### 6.2 A harder case — when Step 0 alone is not enough

A genuinely unengineered test (a small signup-and-welcome-email system,
not built to demonstrate any particular theorem) surfaced a case tougher
than anything above, worth recording honestly including the false start.

**The graph, as actually wired:** `SignupService→SignupValidator`,
`SignupService→UserRepository`, `SignupService→EmailService`,
`SignupValidator→UserRepository`, `EmailService→TemplateEngine`.

**The violation:** `SignupService→SignupValidator→UserRepository` is a
path, and `SignupService→UserRepository` is also a direct edge — a genuine
skip-level shape (Axiom 2), found cold, not engineered.

**First attempt — graph surgery.** Both `SignupService→UserRepository` and
`SignupValidator→UserRepository` passed the Dependency Test individually
(unlike every earlier example, where one edge turned out to be fake). The
fix applied was to shrink `SignupValidator`'s dependency from the whole
`UserRepository` Node down to a single passed-in function (a closure), the
same value-not-Node move used throughout this document. This resolved
Axiom 2 and preserved behavior exactly (verified by running both versions
side by side).

**The challenge — was this premature?** It was pointed out that Step 0
(Rename/Recalibrate) had not actually been applied before reaching for
graph surgery. Retroactively applying it to `SignupValidator` surfaced a
real, separate problem: its responsibility sentence required an "and" to
be honest — "validates input shape **and** checks uniqueness against
storage" — exactly the smell Step 0 exists to catch (§0). This was split
into two honestly-named Nodes: `InputShapeValidator` (pure syntax checks,
no dependencies) and `UniquenessChecker` (a genuine data check, depending
on `UserRepository`).

**The result, checked rather than assumed.** Splitting responsibility
honestly did **not**, on its own, resolve the Axiom 2 violation: the
resulting graph — `SignupService→UniquenessChecker→UserRepository` as a
path, alongside `SignupService→UserRepository` directly — is still exactly
the skip-level shape, confirmed by checking it against the formal
definition rather than assuming clean naming was sufficient. This was
further checked against Theorem 7 (Parent Independence) to rule out a
misdiagnosis: Theorem 7 covers two Nodes both pointing at a shared target
as **peers** (`^UserRepository = {A, C}`, neither routing through the
other) — the actual shape here is a **path plus a direct edge from the
same origin**, which is Axiom 2's violation, not Theorem 7's. The
misdiagnosis was checked and ruled out explicitly, not assumed away.

**The honest conclusion.** Both fixes were necessary, and they addressed
two different, non-substitutable problems: **Step 0 corrects dishonest
responsibility naming** (a real defect, independent of graph shape — a
node whose sentence needs "and" is wrong regardless of what it's wired
to), while **Axiom 2 compliance requires an actual structural change**
(shrinking a dependency from a Node reference to a value) **even after**
naming is fully honest. Clean responsibility names do not, by themselves,
guarantee an acyclic-and-unskipped graph — two independently well-named,
individually justified Nodes can still converge on a shared target in a
skip-level shape, and only a structural fix resolves that, not a naming
fix. Neither step is a substitute for the other; both are required, and
neither was optional in this case.

### 6.3 Why this matters for refactoring

Because Sibling (shared parent) plus any direct edge between the pair always
reconstructs a skip-level triangle, **the invariant is self-enforcing, not a
convention to remember**:

1. **A mechanical test.** For every pair in `~X`, check for any edge between
   them. Finding one means the graph was never well-formed, or the
   invariant has eroded since it was built.
2. **Predictable change.** While Sibling genuinely holds, a change to one
   member can never directly ripple into the other — only back up through
   the shared parent's contract (the shielding theorem).
3. **A dictated repair, not a judgment call.** The Axioms hand you the only
   two legal fixes: either the direct edge from the shared parent was
   already redundant (promote the chain, Axiom 3), or the hidden edge
   should never have existed and the dependency was really just a value
   (restore Sibling, as above). Which repair applies is answered by running
   the Dependency Test again on the specific edge in question.

---

## 7. Theorems

Formal statements, each proven from the Axioms alone — not stipulated, not
descriptive vocabulary. Each theorem's proof appeals only to Axioms 1–3 and
the definitions in §1/§3.

### Theorem 1 — Shielding

**Statement.** If `A→B→C` (and, per Axiom 2, `A↛C` directly), then a change
to C affects A **only if** that change alters B's observable contract. C's
influence on A is mediated by B.

**Proof.** By Axiom 2, no edge `A→C` exists — A's only route to anything C
provides is through B. A can only observe C's behavior as it appears
*through B's interface* (whatever B exposes as a result of its own use of
C). If C changes internally but B's output/contract to A is unchanged, A
has no way to detect or be affected by the change — it never had a channel
to C other than B. ∎

**Corollary (Peer Collapse under violation).** If a skip-level edge `A→C`
is added alongside `A→B→C` (violating Axiom 2), the shield is removed: A
now has an unmediated channel to C, and any change in C affects A regardless
of B's contract. C becomes structurally indistinguishable from B in terms
of direct risk exposure to A — it is promoted from a shielded grandchild to
an effective Sibling-in-risk, even though no `~A` membership formally
changes. This is the reasoning that motivated Axiom 2 in the first place.

### Theorem 2 — Sibling Independence

**Statement.** If `A, B ∈ ~X` for some real node X, then `A→B` and `B→A`
are both false.

**Proof.** `A, B ∈ ~X` means `X→A` and `X→B` both hold (definition of `~X
= D(X)`). Suppose, for contradiction, `A→B` also holds. Then `X→A→B` is a
path, and `X→B` is simultaneously a direct edge — this is precisely the
skip-level configuration forbidden by Axiom 2 (X reaching B both directly
and via A). Contradiction. By symmetry, `B→A` leads to the same
contradiction with A and B's roles swapped. Therefore neither edge can
exist while `A, B ∈ ~X` and Axiom 2 holds. ∎

**Corollary (Refactoring invariant).** Discovering a real edge between two
Nodes currently classified as Siblings is proof the graph was never
well-formed under Axiom 2 — not a style concern. See §6 for the worked
repair procedure.

### Theorem 3 — Minimality Floor (Bounded Deliberate Risk)

**Statement.** If `D(A)` is irreducible-minimal (Axiom 3, fully satisfied),
then A's *direct* risk exposure is fixed at exactly `|D(A)|`, and it cannot
decrease without shrinking A's actual responsibility, nor can it increase
except by a new edge being deliberately added.

**Proof.** By Axiom 3's minimality condition, every `X ∈ D(A)` is necessary:
removing the edge `A→X` would leave A unable to fulfill its stated
responsibility (§0, Recalibrate). So no further reduction of `|D(A)|` is
possible without redefining A's responsibility itself — the set is at its
floor. Conversely, `D(A)` does not change on its own: edges are only added
by an explicit act (someone writes `A→Y`); nothing in Axioms 1–3 causes an
edge to appear as a side effect of unrelated changes elsewhere in the graph.
Therefore any increase in `|D(A)|` is traceable to a specific, visible
addition, never incidental drift. ∎

**Corollary (Total vs. direct exposure).** Because of Theorem 1
(Shielding), A's *total* reachable set `R(A)` may be arbitrarily large
without increasing A's risk, since everything in `R(A) \ D(A)` reaches A
only through a mediating direct dependency. Risk to A is therefore governed
by `|D(A)|`, not `|R(A)|` — depth of the dependency tree is not, by itself,
a measure of fragility; breadth of *direct* fan-out is.

### Theorem 4 — Fan-In Amplification

**Statement.** For a node X, the number of independent Nodes exposed to a
contract-breaking change in X is exactly `|^X|`. The blast radius of a
change to X's **contract** scales linearly with `|^X|`; the blast radius of
a change to X's **internals**, contract held constant, remains zero.
Therefore fan-in pressure applies specifically to X's contract, not to
whether X may be changed at all.

**Proof.** By definition, `^X = Δ(X) = {Y : Y→X}`. By Theorem 1
(Shielding), each `Y ∈ ^X` is affected by X only through X's contract — Y
has no other channel to X's behavior. If X's contract changes, every
`Y ∈ ^X` is exposed simultaneously and independently: no member of `^X`
mediates or shields another member's exposure to X (that relationship, if
it exists at all, is a separate Parent-set fact about `^X`, not a channel
back to X). So exactly `|^X|` Nodes are put at risk by a contract change to
X, and — by Theorem 1 again — zero are put at risk by an internal-only
change. ∎

**Corollary (Where to put the care).** A large `|^X|` does not mean X
should be frozen; it means the pressure is asymmetric. X's *internals*
remain the safest place in the graph to make changes, fully protected by
Shielding regardless of how large `^X` grows. X's *contract* is the most
dangerous single surface in the graph to alter carelessly, precisely
because of how many Nodes sit in `^X`. High fan-in is therefore an argument
for hiding change behind a stable interface, not an argument against
changing X at all.

**Corollary (Contract Freedom).** The same fact read in the opposite
direction: contract-change cost is proportional to `|^X|`, so **contract
freedom is proportional to the inverse of `|^X|`.** A Node with small or
empty `^X` — most visibly, a root in `~∅`, since nothing depends on a root
by definition — can alter its contract cheaply, because few or no
dependents are exposed. This is not a separate property from fan-in
pressure; it is the same quantity, named for the freedom it grants rather
than the caution it demands. Note this is a claim about **change-cost**
specifically, not about abstraction level, orchestration role, or any other
design property — those often correlate with position in the graph in
practice, but nothing in Axioms 1–3 forces that correlation, so only the
change-cost claim is provable here.

**Corollary (Weighted Fan-In).** `|^X|` treats every dependent as an
equal, undifferentiated unit of risk, but this is coarser than necessary
once `C(X)` and `U(·,X)` (§1) are available. Define, for each
`fi ∈ C(X)`:

```
weight(fi) = |{ Y ∈ ^X : fi ∈ U(Y,X) }|
```

— the number of dependents that actually use `fi`. The true blast radius
of changing a specific `fi` is `weight(fi)`, not `|^X|`. A Node with large
`|^X|` but one rarely-used function can have most of its contract-change
risk concentrated in a single high-`weight` function, while the rest of
`C(X)` carries little to none. "The widest arrow" (highest fan-in pressure)
is therefore more precisely located at `max(weight(fi))` across `C(X)`, not
at `|^X|` taken as a single undifferentiated number.

### Theorem 5 — Contract Utilization

**Statement.** For a Node A, every Interface Layer member `A+fi ∈ C(A)`
should be used by at least one member of `^A` — that is, `weight(A+fi) ≥ 1`
for every `A+fi ∈ C(A)`. If some `A+fi` has `weight(A+fi) = 0`, its
presence in `C(A)` is unjustified: A's actual, exercised contract is
smaller than its declared one, and `A+fi` is a candidate for removal —
either deletion, or **demotion into a sub-layer**, if `A` still uses it
internally but nothing external ever does.

**Proof.** By the definition of Interface Layer (§1), `A+fi` is
distinguished from a sub-layer `A_B` specifically by being reachable from
outside A — that reachability is the *entire* justification for placing
something in `C(A)` rather than leaving it as internal structure. If
`weight(A+fi) = 0`, no Node outside A currently depends on `A+fi` at all:
the one property that separates an Interface Layer member from a sub-layer
is not actually being exercised. By the Dependency Test (§0), applied here
in reverse — to what A exposes rather than what A requires — a piece of
surface with zero real consumers has not earned its place as `A+fi`; it is
speculative exposure, structurally indistinguishable in practice from a
sub-layer that simply hasn't been correctly reclassified yet. ∎

**Corollary (Mirror of Axiom 3).** Axiom 3 requires `D(A)` to be
irreducible-minimal on the *outgoing* side. Theorem 5 shows the same
minimality pressure exists on the *incoming* side: `C(A)` should shrink to
exactly the Interface Layer members `^A` collectively exercises, no more.
Axiom 3 and Theorem 5 are not the same claim — one is stipulated (Axiom 3,
a rule about what A may depend on), the other is derived (Theorem 5, a
consequence of what Interface Layer membership means combined with the
Dependency Test) — but they are structural mirrors of each other across
the direction of the arrow.

**Corollary (The demotion path, now precisely nameable).** Before Interface
Layer existed as a distinct primitive, a zero-weight contract member had
only one honest fate: removal. With Interface Layer and sub-layer properly
separated, a second fate is now expressible: if `A+fi` has
`weight(A+fi) = 0` externally but `A` still relies on `fi`'s behavior
*internally* (e.g. some other Interface Layer member, `A+run`, calls it),
the correct move is not deletion but **demotion**: `A+fi` becomes `A_fi`,
moving from Interface Layer to sub-layer. This is the direct converse of
Theorem 6's Promote path (sub-layer → Interface Layer, when external reuse
appears) — Theorem 5 identifies exactly when the reverse move
(Interface Layer → sub-layer) is warranted: the moment external usage
drops to zero while internal usage remains.

### Theorem 6 — Composition Lock-In

Theorem 1–4 govern the "can be independent" half of a Layer (§1's original
definition: "responsibility is well defined and can or can't be
independent"). Theorem 6 governs the other half — what happens to a
sub-layer that **can't** be independent.

**Statement.** A sub-layer B of A (`A_B`) has no legal path to reuse
outside of A. Any external Node needing B's behavior must depend on A as a
whole, through A's contract — it can never depend on B directly.
Consequently, if a second Node needs functionality that currently lives
inside some `A_B`, exactly two options exist: **duplicate** the logic, or
**promote** B out of Composition into its own independent Node. There is no
third option.

**Proof.** By the Black-Box Property (§1), A_B was never exposed as
depend-able-on by anything outside A — exposing it would mean the outside
can see inside the box, which contradicts the entire premise of A's
contract as a Layer. `X → A_B` is therefore not well-formed for any
external X, for the same structural reason Axiom 2 forbids A from reaching
past B into C: a black box's internals are never a legal target, only its
declared output is. The only legal edge any external Node can hold toward
A's internals is `X → A` itself. If B's behavior must reach X, it can only
surface through A's own contract (X calls A; A internally uses B). B
remains permanently unreachable directly, by definition of what a Layer is
— not by the accident of whichever language mechanism (private fields,
closures, module scope) is used to enforce it. ∎

**Empirical confirmation (mechanism, not cause).** Built and ran a
`Machine` class with two sub-layers, `Machine_validate` and `Machine_log`,
implemented as JS private fields (`#validate`, `#log`). Private-field
syntax makes the black-box boundary literal in this specific language, but
it is the *enforcement*, not the *reason*, for the boundary — the reason is
the Black-Box Property itself, which would hold even in a language with no
privacy keyword at all (via convention, closures, or module scope instead).
As evidence of how strictly this particular mechanism enforces it: an
attempt to call `machine.#validate(5)` from outside the class does not
throw a runtime permission error — it **fails to parse at all**
(`SyntaxError: Private field '#validate' must be declared in an enclosing
class`).

Introducing a second Node, `Sensor`, needing the same validation logic,
and attempting `Sensor → Machine_validate` directly reproduced the same
parse failure — confirming no third option exists in practice, not just in
principle. Both remaining options were then built and run successfully:

- **Duplicate:** `SensorDuplicated` implements its own private `#validate`,
  copy-pasted from Machine's logic. Runs correctly, but the two copies can
  now drift independently — a real, observable cost.
- **Promote:** the validation logic is extracted into a new, independent
  Node, `NumericValidator`, with its own contract. Both `Machine` and
  `Sensor` are given a real edge to it (`Machine → NumericValidator`,
  `Sensor → NumericValidator`). Both ran correctly, and — notably —
  promotion immediately produces a Parent relation that didn't exist
  before: `^NumericValidator = {Machine, Sensor}`.

**Corollary (The design decision Composition forces).** Keeping something
as a sub-layer is a bet that nothing else will ever need it directly. The
moment a second legitimate consumer appears, Theorem 6 says the only choices
are Duplicate or Promote — and Promote is the moment a piece of Composition
graduates into the outer graph, becoming subject to Axioms 1–3 and Theorems
1–4 for the first time, exactly like any other Node.

**Corollary (A fourth option — Interface Wrap).** Theorem 6's
Duplicate-or-Promote dilemma assumes a shared capability must either be
copied or fully exposed as its own independent Node. A third, general
operation exists: **push the capability down into a single private
sub-layer, then build one honest Interface Layer member per genuinely
distinct consumer, each independently justified by the Dependency Test.**

This is one operation, not two, regardless of where the capability
originated:

- **Source is a separate Node.** A capability previously living in its own
  Node (e.g. `FraudScorer`) is absorbed into the Node that needs it most
  (`CreditValidator`, as `#score`), eliminating the separate Node entirely
  rather than promoting or duplicating it.
- **Source is an existing Interface Layer member.** A capability already
  public under one name (e.g. `RiskEngine.score`) is pushed down into a
  private sub-layer (`#computeRisk`) the moment a second consumer needs the
  *same computation* for a genuinely different purpose, and a new member is
  built alongside the original for that purpose (`auditReport`, returning a
  formatted report rather than a raw number).

In both cases the end state is identical: one private sub-layer, N honest
Interface Layer members, one per distinct need — `A+f1 → A_sub`,
`A+f2 → A_sub`, ..., with `A_sub` never leaving A's black box. The origin
of the capability changes only *how* the private sub-layer is arrived at;
it never changes what the fix looks like once applied.

Checked directly, twice, on independent scenarios. First: `CreditValidator`
held a private sub-layer `#score`, absorbed from what was originally a
separate `FraudScorer` Node. When `OrderApprover` needed the same scoring
capability for its own, separate purpose, a second Interface Layer member,
`getScore()`, was built rather than duplicating or promoting — collapsing
three Nodes and three edges (`A→B`, `A→C`, `B→C`) down to one Node and one
edge (`A→B`), with `^#score = {check, getScore}` forming entirely inside
`CreditValidator`'s own black box. Second: `RiskEngine.score()`, already an
existing public member, had its computation pushed down into a private
`#computeRisk` the moment a second consumer (`Auditor`) needed the same
computation with different output semantics; `score()` and `auditReport()`
now both call the same sub-layer independently, verified to run correctly
side by side with no interference between them.

This gives Composition a fourth named operation, alongside Duplicate,
Promote, and Theorem 11's Split: **Interface Wrap.** It is the correct
choice whenever a shared capability turns out not to need an independent
Node at all — only as many legitimate, contract-level doors into it as
there are genuinely distinct consumers, regardless of whether that
capability started as a separate Node, an existing public method, or was
never built until the second consumer's need revealed it was needed.

### Theorem 7 — Parent Independence

**Statement.** If `A, C ∈ ^D` for some real node D, then `A→C` and `C→A`
are both false — the exact mirror of Theorem 2 (Sibling Independence),
built from the dependency side instead of the dependent side.

**Proof.** `A, C ∈ ^D` means `A→D` and `C→D` both hold (definition of
`^D = Δ(D)`). Suppose, for contradiction, `A→C` also holds. Then `A→C→D`
is a path, and `A→D` is simultaneously a direct edge — this is the
skip-level configuration forbidden by Axiom 2 (A reaching D both directly
and via C). Contradiction. By symmetry, `C→A` leads to the same
contradiction with A and C's roles swapped. Therefore neither edge can
exist while `A, C ∈ ^D` and Axiom 2 holds. ∎

**Why Peer does *not* get this guarantee.** It is tempting to assume all
three relations (Sibling, Parent, Peer) behave symmetrically, but checking
Peer against the same proof method shows it does not:

- Sibling's proof requires a real shared node X with edges `X→A`, `X→B`,
  so that adding `A→B` reconstructs the forbidden `X→A→B` + `X→B` triangle.
- Parent's proof (above) requires a real shared node D with edges `A→D`,
  `C→D`, so that adding `A→C` reconstructs `A→C→D` + `A→D`.
- Peer is `~∅` — Sibling under the *fictitious* anchor `∅`. There is no
  real edge `∅→A` or `∅→C` to begin with, so there is no triangle to
  reconstruct if `A→C` is added between two Peers. Checking directly: if
  `A, C ∈ ~∅` and `A→C` is added, no Axiom is violated — A is a root (no
  real node points to it), so there is no X positioned above A for which
  "reaching C both via A and directly" could even be stated. **Peer
  Independence does not hold.** Two Peers may freely form a real dependency
  between them; the moment they do, they simply stop being Peers (in the
  sense that A now has a real outgoing edge), but nothing in the Axioms
  forbids or is violated by this.

This asymmetry is not an oversight — it is forced by what `∅` is allowed to
be. `∅` can sit at the **tail** of the implicit relation (`A ∈ D(∅)` —
A has no real parent) but can never sit at the **head** of a real edge,
since `X→∅` is not well-formed (∅ is not a Node, nothing can depend on the
absence of a node). Consequently `^∅ = Δ(∅) = {X : X→∅}` is necessarily
**empty for every graph**, not merely small — nothing can legally point at
∅ in the first place. Sibling and Parent both depend on a *real* anchor
node with genuine incoming or outgoing edges to build their triangle-proof
on; Peer's anchor is fictitious in exactly the direction (`^∅`) that the
proof would need, which is why Peer is the one relation of the three that
carries no independence guarantee.

### Theorem 8 — Composition Recurses Without Limit

**Statement.** A sub-layer `A_B` may itself have its own sub-layer `A_B_C`
("B's own internal structure"), and this nesting has no fixed depth limit.
At every level, the same rules apply unchanged: `A_B` is a black box to
`A_B_C` from anywhere outside `A_B` — including from `A`'s *other*
sub-layers — and Axiom 2's no-skip-level rule holds at this scale exactly
as it holds in the outer graph: `A`'s contract may depend on `A_B`, and
`A_B` may depend on `A_B_C`, but `A`'s contract may not skip `A_B` to reach
`A_B_C` directly.

**Proof.** By the Black-Box Property (§1), the reason `A_B` is unreachable
from outside A is that `A_B` was never exposed as depend-able-on — this
reasoning refers only to "what counts as outside" a given black box, and
never assumed A itself was the *only* possible black box in the system.
`A_B`, once it exists as a unit with its own well-defined responsibility
(per the original definition of Layer, §0), satisfies the same premise A
did: it is a Layer, therefore it is entitled to the same Black-Box
Property, applied to whatever it is made of. There is nothing in the
premise that terminates after one level — the property is a statement
about what "well-defined responsibility" means, not about a specific
Node's position in a hierarchy. By induction, if the property holds at
depth n (A's sub-layer is a black box to the outer graph), it holds
identically at depth n+1 (that sub-layer's own sub-layer is a black box to
everything outside it, including A's contract and A's other sub-layers). ∎

**Empirical confirmation — first attempt failed, and the failure is
itself informative.** The first test flattened `#validate` and its helper
`#isNumeric` as two private *methods* on the same `Machine` class, and gave
`Machine` a third method, `testSkip`, that called `#isNumeric` directly,
bypassing `#validate`. This call **succeeded** — no error, no
SyntaxError — revealing that flat class-private methods do not create real
nested black boxes: JS's `#field` privacy is enforced only at the outer
class boundary, and treats every private method on one class as flatly
accessible to every other method on that *same* class, with no internal
nesting between them. `#isNumeric` being "inside" `#validate` was, in that
version, a naming convention only — never an enforced boundary. Theorem 8's
proof was not shown false by this — the Black-Box Property doesn't depend
on which language mechanism enforces it — but the *chosen* mechanism (flat
private methods) was simply the wrong tool to demonstrate depth-2 nesting.

The corrected test made `Validate` its **own class**, with its own private
state, held by `Machine` as a private field (`#validate = new Validate()`)
— a genuine second black box, not a second flat method:

```js
class Validate {
  #isNumeric(x) { return typeof x === "number"; }
  check(input) {
    if (!this.#isNumeric(input)) throw new Error("bad input");
    return true;
  }
}
class Machine {
  #validate = new Validate();
  run(input) {
    this.#validate.check(input);   // the only legal entry point
    return input * 2;
  }
  testSkip(input) {
    return this.#validate.#isNumeric(input); // attempt to skip Validate's own contract
  }
}
```

Here, `m.run(5)` succeeds normally, but `testSkip` — code belonging to
`Machine` itself, not merely outside code — **fails to parse**:
`SyntaxError: Private field '#isNumeric' must be declared in an enclosing
class`. This is the correct confirmation of Theorem 8: once a sub-layer is
a genuine second Layer (its own class, its own private state), even its
own container cannot skip past its contract to reach its internals — the
Black-Box Property held at depth 2 exactly as it held at depth 1, once
tested with a mechanism actually capable of enforcing nested boundaries.

**Practical note this surfaces.** A private *method* on a class is
Composition in name only if its "sub-layer" is meant to be protected from
the class's *own* other methods, not just from the outside world — flat
private methods only guarantee the outer boundary. Genuine recursive
Composition, in JavaScript specifically, requires the sub-layer to be
implemented as its own object with its own private state, not merely
another private method sitting alongside its siblings.

**Strongest form — the private inner class.** The `Validate`-as-separate-
top-level-class version (above) still leaves a gap: `Validate` could be
instantiated independently of `Machine`, and its *name* exists at module
scope even though access to its instances is privately held. A stricter
test declares `Validate` itself as a private static field holding a class
expression, so the class is never a nameable, independent thing at all:

```js
class Machine {
  static #ValidateClass = class {
    #isNumeric(x) { return typeof x === "number"; }
    check(input) {
      if (!this.#isNumeric(input)) throw new Error("bad input");
      return true;
    }
  };
  #validate = new Machine.#ValidateClass();
  run(input) {
    this.#validate.check(input);
    return input * 2;
  }
}
```

Tested against this: `typeof Validate` from outside is `undefined` — the
class was never a top-level name anyone could reference at all, not just
an instance nobody could reach. `new Machine.#ValidateClass()` from outside
fails to parse, the same as before, but now the *class itself*, not merely
its instances, is unreachable. This is Composition in its strictest form:
`A_B` isn't just an inaccessible instance held by A — it can be a
definition that has no existence anywhere outside A's own declaration,
which is the most literal realization of "B is the internal structure of
A" the language can express.

**Corollary (No canonical "bottom").** Because nesting has no forced limit,
Flow Notation does not define an atomic, indivisible unit of
responsibility — a Node is only "atomic" relative to a given decomposition,
i.e., relative to the point where whoever is building the system decided a
responsibility sentence was precise enough (§0, Rename) not to warrant
further opening. "Atomic" is a stopping decision, not a structural fact the
notation can detect on its own.

### Theorem 9 — Chain Attenuation

**Statement.** In a chain `A→B→C→...→N`, a contract change at any node X
propagates to an ancestor only if it forces a contract change at *every*
intermediate node between X and that ancestor. Depth alone does not
determine an ancestor's exposure — the number of *contract-preserving*
links between them does. A longer chain is not inherently riskier for its
root; it is only as risky as its weakest (least-absorbing) link.

**Proof.** By Theorem 1 (Shielding) applied repeatedly along the chain: A
is affected by C only through B's contract; A is affected by D only
through B's contract, regardless of what changed inside C or D, unless
that change also forces B's own output to change. By induction, A is
affected by a change at any node N in the chain only if the change forces
every contract on the path from N back to A, inclusive of the first hop
out of A, to change in turn. If any single hop absorbs the change — its own
contract stays fixed despite its dependency having changed — propagation
stops there. Everything above that point is completely unaffected, no
matter how much deeper the chain continues below it. ∎

**Worked check.** For `A→B→C→D→E`: each node's fan-in is `|^X|=1` (except
`^A=∅`), so by Theorem 4 alone, contract-change *cost* is identical at
every position in the chain — E is not more expensive to change than B
simply for being deeper. What actually varies is *propagation*, governed by
this theorem, not by Theorem 4: whether a change at E reaches A depends
entirely on whether D's contract absorbs it, then C's, then B's — not on
E's distance from A in hops.

**Corollary (Chain length is not the risk variable).** Extending
`A→B→C→D→E` to `A→B→C→D→E→F→G` does not automatically make G more
dangerous to change than E was, nor does it make A more exposed. G's actual
risk to A depends entirely on whether F's contract, then E's, then D's,
then C's, then B's each individually absorb or pass along a hypothetical
change originating at G. A seven-node chain with six well-defined,
absorbing contracts can be strictly safer for its root than a five-node
chain with leaky ones. **Contract quality at each hop, not chain length, is
the operative variable.**

### Theorem 10 — Combined Exposure (Reachability × Width)

**Statement.** The exposure of an ancestor `A` to a change originating at
descendant `N` is not, in general, a single-path product — it is a
**recursive reachability function** over `A`'s entire descendant subgraph,
correctly accounting for nodes reached by more than one route. Writing
`p(X→Yi)` for the probability that the edge `X→Yi` passes a change through
rather than absorbing it, and `R(X)` for the probability that a change
originating below `X` reaches `X`:

```
R(N)  = 1                                              (the origin itself)
R(X)  = 1 − Π over Yi ∈ D(X) [ 1 − p(X→Yi) × R(Yi) ]    (every other node)
```

`R(A)` is then `A`'s reachability from `N` — the corrected replacement for
what earlier read as a plain hop-by-hop product. `R(A)` alone **is**
`Exposure(A, N)`:

```
Exposure(A, N) = R(A)          (with N set as the origin, R(N) = 1)
```

**A weight term was tried here and found to be wrong, not merely
unnecessary.** An earlier draft multiplied in `weight(N)` — the count of
*all* of `N`'s direct dependents for a given function (§1) — under the
assumption that a wider blast radius at the origin should scale up `A`'s
own exposure. Checked directly with an adversarial case: if `N` has three
direct dependents and only one of them (`X1`) lies on any path to `A`
(the other two are unrelated branches that never reach `A` at all),
`weight(N) = 3` while the true reachability through the one relevant path
was `0.56` — multiplying gives `1.68`, a number inflated purely by two
dependents that have nothing to do with `A`. `weight(N)` is a **global**
count, unscoped to any particular ancestor; `R(A)` is already **correctly
scoped**, since its recursion only ever walks through nodes that actually
lie in `A`'s own descendant subgraph. Multiplying an unscoped count into a
correctly-scoped probability is a category error, not a refinement — the
fix is to drop `weight(N)` from this formula entirely. `R(A)` alone already
accounts for every real branch and convergence point between `N` and `A`;
nothing external needs to be multiplied back in.

`weight` is not useless — it answers a different, legitimate question
(Theorem 4's original one: how many things, in total, are hit when `N`'s
contract changes, independent of any one ancestor) — it simply does not
belong inside an ancestor-specific `Exposure(A, N)` figure. Its one correct
role inside Theorem 10 is covered separately, in the multi-function
corollary below, where it counts something genuinely different: not
*dependents of N*, but *distinct usable functions of N*, each with its own
independently-computed `R(A)`.

**Why this replaces a plain product.** The original formulation,
`weight(N) × (p_1 × p_2 × ... × p_k)`, had two separate problems, both
confirmed by direct testing rather than assumed. First, it is correct only
when there is exactly **one** path from `N` to `A` — checked against a
graph containing two real convergence points (a node with more than one
direct dependent), where the single-path product could not be applied to
either one without a further rule the original statement never supplied;
the correct combined probability that a change reaches `A` by *at least
one* of several independent routes is `1 − Π(1 − p_i)`, not any single
path's product, and never a sum (which can exceed 1 and answers a
different question). Second, the `weight(N)` term itself was wrong to
include at all, once `R(A)`'s scoped recursion existed — this is addressed
directly above.

**Proof.** `R(X)`'s recursive step is the direct generalization of the
standard independent-OR rule to an arbitrary number of parents-in-the-
propagation-graph: the probability that *none* of `X`'s direct dependents
carry the change through is the product of each one individually failing
to do so, `Π [1 − p(X→Yi) × R(Yi)]`, since each `Yi`'s route is independent
of every other `Yi`'s route by construction (each edge's `p` is a property
of that specific contract alone). The probability that *at least one*
route succeeds is the complement of all of them failing, giving the stated
recursive step. When every node on the path from `N` to `A` has exactly one
dependent, the product at each step has only one term, and
`1 − (1 − z) = z` algebraically for any single `z` — so `R(X)` collapses
identically to the original plain product whenever there is no
convergence, confirmed numerically on a five-hop single chain (`R = p1 ×
p2 × p3 × p4 × p5` exactly, to four decimal places). The recursion
correctly generalizes the old formula rather than replacing it outright:
the old formula is `R`'s single-path special case, not a separate, wrong
idea. ∎

**Worked check — a real convergent graph.** For `A→B→C→D→E`, `A→F→G→D`,
`A→H→I→C` (two convergence points: `D` has parents `{C, G}`, `C` has
parents `{B, I}`), computing `R` bottom-up with assigned edge
probabilities gives `R(C) ≈ 0.8165`, `R(D) ≈ 0.7013`, `R(E) ≈ 0.561` —
each properly combining both of its routes upward via the OR-rule, rather
than reflecting only one arbitrarily chosen path. Naively computing via a
single path through `D` alone (ignoring the `G` route) would have
understated `R(D)`; computing via `G` alone would have understated it
differently. Only the recursive combination gives the correct value.

**Corollary (Total exposure across an entire subgraph).** `A`'s full
exposure is not bound to one chosen origin `N` — every node in `A`'s
descendant subgraph is a potential, independent source of change. Summing
`R(A ← N)` (computed with `N` set as the origin, `R(N)=1`) across every
such `N` gives a single scalar describing `A`'s total exposure to its
entire dependency subgraph at once:

```
TotalExposure(A) = Σ over every node N in A's descendant subgraph [ R(A ← N) ]
```

`weight` does not appear here either, for the same reason it was dropped
from the single-origin formula: each `R(A←N)` term is already correctly
scoped to `A`'s own subgraph, and multiplying in `N`'s total dependent
count would reintroduce the same overcounting confirmed above. Checked on
the same convergent test graph: summing each node's individually-computed
reachability to `A` gives a total scalar of `≈ 6.09` — this number is
unchanged from the earlier (incorrect) version of this corollary, because
that version used `weight = 1` for every node "for simplicity," which
silently made the bug inert in that specific worked example (multiplying
by 1 changes nothing) — the number was never wrong, only the formula
written beside it was. As with the multi-function corollary below, this
total is an **expected count of independent exposure events**, not a
probability — it is expected to exceed 1 once a subgraph has more than a
couple of plausible origins, and that is the correct, informative reading,
not an error to correct.

**Corollary (Homogeneous single-path chains reduce to `p^k`).** When there
is no convergence anywhere on the path and every hop shares one uniform
probability `p`, `R` collapses to `p^k` — geometric decay in depth, exactly
as originally stated, now confirmed as the correct special case rather
than the general rule.

**Corollary (What is actually measurable — `weight` vs. `p`).** The two
terms in the formula are not equally obtainable from real code, and this
matters for anyone trying to apply Theorem 10 rather than just state it:

- **`weight(N)` is directly countable.** It is defined (§1) as
  `|{ Y ∈ ^A : fi ∈ U(Y,A) }|` — the number of dependents whose code
  actually calls a given function. This can be measured mechanically, by
  reading call sites, for any real codebase. It is not arbitrary.
- **`p(X→Yi)` is not directly countable in the same way.** It asks a
  counterfactual — if this dependency's contract changed, would this
  hop's own contract also have to change — which is not a fact sitting in
  the current code, only in how tightly that specific boundary is
  designed. In practice, `p` is either (a) a design-time estimate, where a
  thin, stable, well-abstracted interface is assigned a low `p` and a
  leaky, pass-through interface is assigned a high `p`, or (b) an
  empirical estimate drawn from version-history data, if available — e.g.
  how often a change at the dependency historically forced a matching
  change at this hop, across past releases.

A node-intrinsic term — call it `t(X)`, the baseline chance `X` is edited
directly, independent of anything it depends on — was considered as a
further refinement (folding `t(X)` into `R(X)`'s recursive step as an
additional independent OR-term at every node, not only at leaves). It was
confirmed, by direct test, to be **conceptually distinct from and not
derivable from `p`**: two structurally identical leaves can have wildly
different real-world edit frequency with no edge to attach that difference
to, and a leaf edited constantly under a well-shielded contract can still
contribute almost nothing to its parent's exposure (`t` high, `p` low,
their product low) — confirming the two must remain independent factors,
never conflated. `t(X)` is deliberately **not** included in the formula
above: it would require estimating a volatility figure for every node in a
subgraph, an even harder estimation burden than `p` already is, and the
formula as stated (`R(N)=1` at a chosen origin) already answers the more
tractable, still-useful question — *given* a change at a specific point,
how far does it spread — without requiring an estimate of how likely that
originating change was in the first place. `t(X)` is documented here as
an open, deliberately-excluded extension, not a gap that was missed.

Flow Notation gives the exact combination rule once `p` and `weight` values
are known, but it does not itself supply a mechanical procedure for
obtaining `p` the way it does for `weight`. This is a real limitation to
state plainly, not a gap to paper over: the width term is an observation;
the propagation term is a judgment or an estimate.

**Corollary (Unpacking an expected value into a real distribution).** A sum
like `1.7`, arising when a Node's contract has multiple independently-used
functions, should not be read as "one function's exposure is certain and a
second is likely" — that implies one term equals 1, which is rarely true.
The correct unpacking, for two independent exposures `p1`, `p2`, is the
full distribution over how many of them actually reach the ancestor:

```
P(neither reaches)     = (1−p1)(1−p2)
P(exactly one reaches) = p1(1−p2) + (1−p1)p2
P(both reach)          = p1·p2
```

Checked numerically for `p1=0.9, p2=0.8`: `P(neither)=0.02`,
`P(exactly one)=0.26`, `P(both)=0.72` — summing to 1, with expected value
`0(0.02)+1(0.26)+2(0.72)=1.7`, matching the simple sum exactly (as it must,
by linearity of expectation, regardless of independence). The sharper
reading of `1.7` is not "one is certain, a second is likely" but "the
dominant single outcome, at 72%, is that both functions' changes reach this
node" — the full distribution, where feasible, gives a materially sharper
picture than the sum alone.

**Corollary (Why width and reachability are both necessary).** A node with
enormous `|^X|` (large Theorem 4 width) sitting behind several
well-absorbing, non-convergent contracts (small `R`) may pose *less* real
systemic risk than a node with small `|^X|` sitting directly behind one
leaky, or heavily convergent, path. Total risk requires both terms
multiplied together — treating either width or reachability alone as "the"
risk measure understates true exposure in either direction.

### Theorem 11 — Interface-Layer Sibling Refinement

**Statement.** Sibling, as defined at the Node level (`~A = D(A)`),
collapses every dependency of A into one flat set. Once Interface Layer
exists as a distinct primitive, a finer relation is available: for a
specific Interface Layer member `A+f`, its own dependency set
`D(A+f) ⊆ D(A)` may be a **strict subset** of A's full dependency set — and
different members of `C(A)` may have different, non-identical subsets.
Two Nodes that are Siblings under A (`~A`) are not necessarily Siblings
under any single Interface Layer member of A — Sibling at the Node level
does not imply co-usage at the Interface Layer level. Conversely, a Node
used by *every* Interface Layer member of A is a genuine convergence point
invisible at the Node-level resolution alone.

**Proof.** By definition, `D(A) = ⋃ over f ∈ C(A) of D(A+f)` — A's total
dependency set is the union of what each of its Interface Layer members
individually requires (this must hold, since A can only reach a dependency
through some member of its own contract implementing that reach). If
`D(A+f1)` and `D(A+f2)` are not identical subsets of `D(A)` for two
different members `f1, f2 ∈ C(A)`, then two Nodes `X, Y ∈ ~A` with
`X ∈ D(A+f1)` and `Y ∈ D(A+f2), X ∉ D(A+f2)` are Siblings at the Node level
(both in `D(A)`) but are never co-used by any single Interface Layer
member — no `A+f` depends on both. This is consistent with, not a
violation of, Theorem 2 (Sibling Independence still holds: X and Y have no
edge between each other either way) — it is a refinement of *granularity*,
not a contradiction of the coarser relation. ∎

**Empirical confirmation.** Built a `PaymentProcessor` with three
dependencies — `DiscountEngine`, `TaxCalculator`, `LoyaltyEngine` — giving
`~PaymentProcessor = {DiscountEngine, TaxCalculator, LoyaltyEngine}` at the
Node level, a single flat Sibling set. Two Interface Layer members were
then defined: `charge(total, itemCount)`, using only `DiscountEngine` and
`TaxCalculator`, and `chargeWithLoyalty(total)`, using only `LoyaltyEngine`
and `TaxCalculator`. Checked directly: `DiscountEngine` and `LoyaltyEngine`
are Siblings at the Node level but share **no** Interface Layer member that
depends on both — confirmed by reading each method's body, not assumed.
`TaxCalculator`, by contrast, appears in *both* `D(charge)` and
`D(chargeWithLoyalty)` — a genuine convergence point that is invisible if
you only look at `~PaymentProcessor` as one undifferentiated set, and only
becomes visible once Sibling is checked per Interface Layer member rather
than per Node.

**Corollary (What this means for refactoring granularity).** Theorem 2's
refactoring invariant (§6) — "check every Sibling pair for a hidden edge" —
remains correct at the Node level, but Theorem 11 shows it can be applied
more precisely: a Node-level Sibling check may pass (no edge between
`DiscountEngine` and `LoyaltyEngine`) while still leaving a real design
question unexamined — whether `PaymentProcessor`'s own Interface Layer
members are cleanly separated by *which* dependencies they actually use, or
whether every method uses every dependency indiscriminately.

**Corollary (The remedy is Split, not Promote/Demote).** Theorem 11's
finding is not a visibility problem, so Theorem 6's Promote and Theorem 5's
Demote do not apply here — both of those remedies operate on whether a
piece of behavior is reachable from outside a Node, and every member
involved in Theorem 11's finding is already correctly, legitimately public.
The actual defect Theorem 11 exposes is **cohesion**: two (or more)
Interface Layer members whose dependency sets never overlap are candidates
for living in two separate Nodes rather than one. The correct remedy is a
third operation, distinct from Promote and Demote — **Split**: partition
the Node along the boundary Theorem 11 revealed, giving each resulting Node
its own honest, fully-justified dependency set.

Checked directly: splitting `PaymentProcessor` into `DiscountPayment`
(`{DiscountEngine, TaxCalculator}`) and `LoyaltyPayment`
(`{LoyaltyEngine, TaxCalculator}`) preserves identical output for both
original methods (`97.2` and `102.6`), while resolving the hidden
multi-responsibility Theorem 11 found. `TaxCalculator` — the genuine
convergence point identified earlier — correctly remains a Sibling-like
shared dependency across both resulting Nodes (specifically, both
`DiscountPayment` and `LoyaltyPayment` now sit in `^TaxCalculator`,
governed by Theorem 7, Parent Independence, exactly as expected of a real,
justified shared dependency, not a symptom of anything wrong).

This gives Flow Notation a complete three-remedy vocabulary for contract
defects, each targeting a different axis: **Promote** (a sub-layer needs
external reuse — a visibility problem, Theorem 6), **Demote** (an Interface
Layer member has lost external use — also a visibility problem, Theorem 5),
and **Split** (a Node's own Interface Layer members don't share dependency
cohesion — a granularity problem, Theorem 11). None of the three substitute
for either of the others; each is the dictated repair for a specific,
distinct, mechanically-detectable condition.

---

## 8. Beyond the Axioms — Applied Models

Everything in §7 is proven: each Theorem follows necessarily from Axioms
1–3, and nothing there could be false while the Axioms hold. This section
is different in kind, not just in number, and is kept structurally
separate to avoid diluting that guarantee. Nothing here earns a `∎`.

### 8.1 Analogy — The Load Path

A mnemonic, not a proof: Flow Notation's three Axioms rhyme closely with
**load path**, a real, precise term from structural engineering — useful
for feeling the stakes of each Axiom, not for claiming the two domains
share underlying mathematics.

- **Axiom 1 (Unidirectional Flow) ~ gravity.** Load in a standing structure
  only ever flows downward, roof to foundation. A beam does not "depend
  upward" on the roof — the roof's weight depends on the beam beneath it.
  Load flowing upward in a standing structure is not a variation; it is a
  sign something has already failed.

- **Axiom 2 (No Skip-Level Access) ~ a continuous load path.** A
  **discontinuous load path** — weight bypassing its intended intermediate
  support and landing directly on something further down — is a named,
  serious structural engineering failure mode, not a style preference.
  Skipping a member means load arrives somewhere never sized to carry it,
  with no warning until it breaks. That is Axiom 2's violation translated
  into a domain where the failure is catastrophic rather than abstract.

- **Axiom 3 (Local Minimal Fan-Out) ~ no more supports than the load
  requires.** A well-engineered structure carries its load through exactly
  the members needed, not padded with unjustified extras — more material
  is more inspection points, more places to eventually fail. Worth being
  honest that real buildings do add deliberate safety-factor redundancy
  beyond the bare theoretical minimum, so the analogy is not exact here —
  but the underlying instinct, no unjustified extra support, is the same
  discipline Axiom 3 encodes for software.

### 8.2 Beyond the Model

What follows is a **model**, not a Theorem — a claim about how software is
actually edited over time, informed by Flow Notation's own definitions but
not logically entailed by the Axioms the way Shielding or Sibling
Independence are. It is not numbered alongside the eleven proven results
in §7.

#### Tendency Decay (a lifecycle model)

**Claim.** Let `t(X)` be the tendency of Node `X` to be edited for its own
reasons — evaluated **purely on X's own code body**, independent of
anything `X` depends on (§7, Theorem 10's corollary: `t` is never inherited
through an edge; only `R` is). `t(X)` is not fixed over `X`'s lifetime:

- **Young Nodes have high `t(X)`.** Freshly written code is unstabilized —
  its shape, edge cases, and exact responsibility are still being
  discovered, so edits are frequent.
- **Over time, `t(X)` trends toward an asymptotic floor determined by
  whether X is Closed or Open** (the distinction established earlier: a
  Closed Node contains nothing in its own body anchored to something
  outside the graph; an Open Node's own body contains a locally-anchored
  external reference — a policy constant, a legally-mandated figure, a
  hardcoded precision decision).
  - **Closed Nodes decay toward 0.** Once a self-contained responsibility
    is fully explored, the space of plausible edits is exhausted, and
    genuine reasons to touch the code become rare, then absent.
  - **Open Nodes decay toward a floor strictly between 0 and 1.** The
    external anchor never stops existing, so edits never fully cease —
    but an Open Node is also not edited continuously, so the floor never
    reaches 1 either.
- **The trend is not monotonic, but its long-run direction is fixed.**
  `t(X)` may spike upward at any point — a new feature, a bug, a
  redesign — but as elapsed time approaches infinity, the trend is
  downward, converging toward the Node's respective floor. Spikes do not
  reset the long-run trend; they are noise on top of a decaying signal.

**Why this is a model, not a Theorem.** `t(X)` is a human behavioral
quantity — how often a team chooses to edit something — not a
graph-structural one, so it cannot be derived from Axioms 1–3 the way
Sibling Independence or Shielding were. Nothing here is a guaranteed
consequence of the Axioms holding; it is an external, empirical pattern
being layered on top of Flow Notation's vocabulary, borrowing its terms
(`t(X)`, Closed/Open) without borrowing its proof obligations. What can be
said in its favor: it matches a very common, widely observed pattern in
real codebases — new modules churn heavily during their first exposure to
real use, and stabilize once their edge cases are known — and the
Closed/Open split gives a principled reason for *where* that stabilization
bottoms out, rather than assuming every Node eventually reaches zero. That
is evidence for a plausible model, not proof of a theorem.

**Worked check, qualitative.** Using the four cases already built
(`RoundToNearestCent`, `TaxCalculator`, `OrderTotal`, `InvoiceGenerator`):
`RoundToNearestCent` (Leaf, Closed) should show `t` decaying to
approximately 0 once its handful of rounding edge cases are settled.
`TaxCalculator` (Leaf, Open) should show `t` decaying only to a nonzero
floor, since tax law never stops moving. `OrderTotal` (non-Leaf, Closed,
depending only on Closed things) should also decay toward 0, its own body
containing no external anchor. `InvoiceGenerator`, evaluated **purely on
its own body** per the corrected definition, decays toward 0 as well —
its *inherited* exposure through `TaxCalculator` is a separate, nonzero
quantity captured by `R(InvoiceGenerator)`, not by `t(InvoiceGenerator)`
itself, confirming the two must stay formally distinct exactly as the
corrected Theorem 10 requires.

**Practical note (a leading indicator, not a risk score on its own).**
`t(X)`'s trajectory is most useful as a *signal about where a Node sits in
its own lifecycle*, not as a standalone danger measure: a young Node with
high `t(X)` is not necessarily dangerous, only unsettled — the real risk
(Theorem 4, Theorem 10) still depends on `weight` and `R`, which `t(X)`
feeds into but never replaces. A mature Node whose `t(X)` has decayed to
its floor, if that floor is nonzero (Open), is a more honest long-term
risk than a young Node whose currently-high `t(X)` is simply the normal
noise of not being finished yet.

### 8.3 Implications of Flow Notation, as of now

A plain summary of what the system currently is and is not, stated
honestly rather than optimistically.

**What is actually proven.** Eleven Theorems, each following necessarily
from three Axioms and one Black-Box Property, each checked against real,
running code — including cases constructed specifically to try to break
them. Two of those checks failed on the first attempt and were corrected
in the open (§6.2, Theorem 8's empirical confirmation, Theorem 10's
convergence fix), which is itself part of the evidence for the eleven that
remain: nothing here was accepted because it sounded right, only because
it survived being tested against adversarial cases.

**What the system gives a practitioner, concretely.** A methodology (§0)
for naming responsibility precisely before trusting any edge; a mechanical
test (§0, §5) for telling a real dependency from an incidental one; a
provable invariant (Theorem 2, Theorem 7) for catching hidden coupling
between things that were never supposed to touch; four named, distinct
remedies for four distinct structural defects (Promote, Demote, Split,
Interface Wrap), each dictated by which specific theorem is violated,
never a matter of taste; and a quantitative exposure formula (Theorem 10)
that turns "if it works, don't touch it" from a fear into a checkable
number, including an honest accounting of which of its inputs are
countable from code and which require judgment.

**What the system does not do.** It does not replace human judgment — Step
0 and the Dependency Test are procedures a person applies, not a
mechanical oracle; their output is only as reliable as how honestly they
were carried out (§7's own conclusion on this point). It does not perform
decoupling for a tangled design — it can only prove that a given
decomposition is, or is not, internally consistent, and refuse to produce
an answer when a responsibility genuinely cannot be named honestly. It
does not measure abstraction level, code quality in any aesthetic sense,
or anything about a system's behavior beyond its dependency structure. And
as §8.2 makes explicit, it does not yet have a proven account of *why* a
graph changes over time — only a stated, clearly-marked model for it,
separate from the eleven results that can be trusted without qualification.

**Where this leaves the document.** A complete, internally consistent
formal system for dependency architecture, with a load-bearing distinction
between what is proven and what is proposed, maintained deliberately even
when — as with the corrected material in §8 — that distinction cost giving
up a result that had already been written down as settled. That
willingness to retract rather than keep a convenient but unearned claim is,
as much as any individual Theorem, the actual content of what Flow
Notation is.

## Code examples

Every claim in this document that could be tested against real code was
tested — including the ones that failed on the first attempt and had to be
corrected (see `§6.2` and Theorem 8's empirical confirmation for two examples
where the first version was wrong, and the document says so explicitly).

| File | Tests |
|---|---|
| `examples/sibling-example.js` | Theorem 2 (Sibling Independence) — a hidden edge between Siblings, found and fixed |
| `examples/sublayer-example.js` | The Black-Box Property — private methods as a first attempt at Composition |
| `examples/theorem5-test.js` | Theorem 6 (Composition Lock-In) — Duplicate vs. Promote, both built and run |
| `examples/theorem5-demotion.js` | Theorem 5 corollary — demoting an Interface Layer member to a sub-layer |
| `examples/theorem6-interface-wrap.js` | Theorem 6 corollary — Interface Wrap, a fourth remedy: absorb a capability (originally a separate Node) into a private sub-layer, then build a second Interface Layer member on the same Node |
| `examples/theorem6-interface-wrap-generalized.js` | Interface Wrap generalized — same operation when the source is an existing Interface Layer member, not a separate Node: push it into a private sub-layer, build one honest doorway per distinct consumer |
| `examples/tendency-decay-purely-local.js` | Tendency Decay model (§8, not a Theorem) — confirms `t(X)` must be evaluated purely on a Node's own body, never inflated just by depending on an Open Node; includes the Math.PI vs. hardcoded 3.14 case |
| `examples/theorem8-nested-composition.js` | Theorem 8 — the failed flat-private-method attempt, then the corrected nested-class version |
| `examples/theorem10-real.js` | Theorem 10 — exposure formula applied to a real 4-node chain, weight and `p_i` estimated from actual code |
| `examples/theorem10-refined-reachability.js` | Theorem 10, refined — recursive `R(X)` correctly handling convergence points (a node with more than one parent), confirmed on a graph with two real convergence points |
| `examples/barren-ancestor-descendant.js` | §3 relations — Barren (`~X = ∅`), and the full transitive closures Ancestor (`↑X`) and Descendant (`↓X`), confirmed on the same convergent test graph |
| `examples/theorem11-interface-granularity.js` | Theorem 11 — Interface Layer dependency sets diverging within one Node |
| `examples/theorem11-split-remedy.js` | Theorem 11's Split remedy — verified behavior-identical before and after |
| `examples/messy-checkout.js` | An unengineered messy example — found and fixed a real hidden edge (Discount → Cart) |
| `examples/messy-signup.js` / `examples/messy-signup-fixed.js` / `examples/messy-signup-step0.js` | The hardest case in this document — a real skip-level violation where both edges passed the Dependency Test, requiring two separate, non-substitutable fixes (`§6.2`) |

Every file runs standalone with `node examples/<filename>.js`.