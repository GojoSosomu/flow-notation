// ============================================================
// Four cases: LeafNode x {closed, open}, non-LeafNode x {closed, open}
// ============================================================

// --- CASE 1: LeafNode, CLOSED ---
// D(X) = empty, AND correctness depends on nothing outside the graph.
// A pure math utility -- its rules are self-defined and permanent.
class RoundToNearestCent {
  round(amount) {
    return Math.round(amount * 100) / 100;
  }
}
// t(RoundToNearestCent) trends to 0 -- there is nothing external
// forcing it to keep changing. Once written correctly, it's done.


// --- CASE 2: LeafNode, OPEN ---
// D(X) = empty (no OTHER NODE in the graph), but correctness is
// anchored to something outside the graph that keeps moving.
class TaxCalculator {
  calculate(total) {
    const CURRENT_TAX_RATE = 0.08; // this number is set by LAW, not by us
    return total * (1 + CURRENT_TAX_RATE);
  }
}
// t(TaxCalculator) has a NONZERO FLOOR forever -- tax law changes
// independent of how mature or well-tested this code becomes.
// Structurally a leaf (D = empty), but NOT self-contained.


// --- CASE 3: non-LeafNode, CLOSED ---
// D(X) != empty, but EVERYTHING in its subgraph is also closed.
class DiscountEngine {
  applyDiscount(total, itemCount) {
    return itemCount >= 3 ? total * 0.9 : total; // a fixed BUSINESS rule, self-defined
  }
}
class OrderTotal {
  constructor(discountEngine, rounder) {
    this.discountEngine = discountEngine; // depends on DiscountEngine (closed)
    this.rounder = rounder;               // depends on RoundToNearestCent (closed)
  }
  compute(total, itemCount) {
    const discounted = this.discountEngine.applyDiscount(total, itemCount);
    return this.rounder.round(discounted);
  }
}
// t(OrderTotal) ALSO trends to 0 over time -- it's a non-leaf
// (D(OrderTotal) = {DiscountEngine, RoundToNearestCent}), but its
// WHOLE reachable subgraph is closed: nothing anywhere below it is
// tethered to an unmodeled external reality.


// --- CASE 4: non-LeafNode, OPEN ---
// D(X) != empty, and one of its dependencies is itself open.
class InvoiceGenerator {
  constructor(taxCalculator, rounder) {
    this.taxCalculator = taxCalculator; // depends on TaxCalculator (OPEN!)
    this.rounder = rounder;             // depends on RoundToNearestCent (closed)
  }
  generate(total) {
    const withTax = this.taxCalculator.calculate(total); // Open class dependent, yet it is not worth InvoiceGenerator as Open
    const withFeeRate = withTax * 1.02;                  // This is where it make a class as Open Node
    return this.rounder.round(withFeeRate);
  }
}
// t(InvoiceGenerator) does NOT trend to 0, even though InvoiceGenerator's
// OWN logic never changes -- it inherits TaxCalculator's open exposure
// through Theorem 1 (Shielding): whenever tax law forces a change in
// TaxCalculator's CONTRACT (not just internals), InvoiceGenerator is
// exposed to that pressure too, no matter how mature ITS OWN code is.

const rounder = new RoundToNearestCent();
const taxCalculator = new TaxCalculator();
const discountEngine = new DiscountEngine();
const orderTotal = new OrderTotal(discountEngine, rounder);
const invoiceGenerator = new InvoiceGenerator(taxCalculator, rounder);

console.log("Case 1 (Leaf, closed):", rounder.round(19.995));
console.log("Case 2 (Leaf, open):", taxCalculator.calculate(100));
console.log("Case 3 (non-Leaf, closed):", orderTotal.compute(100, 3));
console.log("Case 4 (non-Leaf, open):", invoiceGenerator.generate(100));