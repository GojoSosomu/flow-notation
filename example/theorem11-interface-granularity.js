// ============================================================
// Theorem 11 test: Interface-Layer Sibling Refinement
//
// ~PaymentProcessor = {DiscountEngine, TaxCalculator, LoyaltyEngine}
// at the NODE level -- one flat Sibling set.
//
// But charge() and chargeWithLoyalty() each use a DIFFERENT
// subset of those three dependencies. DiscountEngine and
// LoyaltyEngine are Siblings at the Node level but are never
// co-used by any single Interface Layer member.
// ============================================================

class DiscountEngine {
  applyDiscount(total, itemCount) {
    return itemCount >= 3 ? total * 0.9 : total;
  }
}

class TaxCalculator {
  calculate(total) {
    return total * 1.08;
  }
}

class LoyaltyEngine {
  applyPoints(total) {
    return total * 0.95;
  }
}

class PaymentProcessor {
  constructor(discountEngine, taxCalculator, loyaltyEngine) {
    this.discountEngine = discountEngine;
    this.taxCalculator = taxCalculator;
    this.loyaltyEngine = loyaltyEngine;
  }

  // D(charge) = {DiscountEngine, TaxCalculator}
  charge(total, itemCount) {
    return this.taxCalculator.calculate(
      this.discountEngine.applyDiscount(total, itemCount)
    );
  }

  // D(chargeWithLoyalty) = {LoyaltyEngine, TaxCalculator}
  chargeWithLoyalty(total) {
    return this.taxCalculator.calculate(
      this.loyaltyEngine.applyPoints(total)
    );
  }
}

const pp = new PaymentProcessor(
  new DiscountEngine(),
  new TaxCalculator(),
  new LoyaltyEngine()
);

console.log("charge(100, 3):", pp.charge(100, 3));
console.log("chargeWithLoyalty(100):", pp.chargeWithLoyalty(100));

// Node-level Sibling set: {DiscountEngine, TaxCalculator, LoyaltyEngine}
// Interface-Layer-level sets:
//   D(charge)            = {DiscountEngine, TaxCalculator}
//   D(chargeWithLoyalty) = {LoyaltyEngine, TaxCalculator}
//
// DiscountEngine and LoyaltyEngine: Siblings at Node level,
// but NEVER co-used by the same Interface Layer member.
// TaxCalculator: appears in BOTH -- a real convergence point,
// invisible if you only look at the Node-level Sibling set.