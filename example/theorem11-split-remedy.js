// ============================================================
// Theorem 11's remedy: SPLIT, not Promote/Demote.
//
// PaymentProcessor's charge() and chargeWithLoyalty() had
// non-overlapping dependency sets -- a cohesion problem, not
// a visibility problem. The fix is to split into two Nodes,
// each with its own fully-justified, fully-overlapping
// dependency set.
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

// Split result #1: everything this Node touches is genuinely shared.
class DiscountPayment {
  constructor(discountEngine, taxCalculator) {
    this.discountEngine = discountEngine;
    this.taxCalculator = taxCalculator;
  }
  charge(total, itemCount) {
    return this.taxCalculator.calculate(
      this.discountEngine.applyDiscount(total, itemCount)
    );
  }
}

// Split result #2: same pattern, different pairing.
class LoyaltyPayment {
  constructor(loyaltyEngine, taxCalculator) {
    this.loyaltyEngine = loyaltyEngine;
    this.taxCalculator = taxCalculator;
  }
  charge(total) {
    return this.taxCalculator.calculate(
      this.loyaltyEngine.applyPoints(total)
    );
  }
}

const tax = new TaxCalculator();
const discountPayment = new DiscountPayment(new DiscountEngine(), tax);
const loyaltyPayment = new LoyaltyPayment(new LoyaltyEngine(), tax);

console.log("discountPayment.charge(100, 3):", discountPayment.charge(100, 3));
console.log("loyaltyPayment.charge(100):", loyaltyPayment.charge(100));

// Both outputs match the original PaymentProcessor's behavior exactly
// (97.2 and 102.6), confirming Split preserves behavior while resolving
// the Theorem 11 finding.
//
// TaxCalculator is now correctly a shared dependency of BOTH resulting
// Nodes -- ^TaxCalculator = {DiscountPayment, LoyaltyPayment} -- governed
// by Theorem 7 (Parent Independence), exactly as expected of a genuine,
// justified shared dependency rather than a symptom of a problem.