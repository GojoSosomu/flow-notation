// ============================================================
// A small, realistically messy "checkout" system.
// Nobody designed this on purpose — it grew feature by feature.
// We have NOT cleaned this up. This is the raw input.
// ============================================================

class CartManager {
  constructor() {
    this.items = [];
  }
  addItem(item) { this.items.push(item); }
  getItems() { return this.items; }
  getTotal() {
    return this.items.reduce((sum, i) => sum + i.price, 0);
  }
}

class DiscountEngine {
  applyDiscount(total, itemCount) {   // plain number in, not a CartManager reference
    if (itemCount >= 3) return total * 0.9;
    return total;
  }
}

class TaxCalculator {
  calculate(total) {
    return total * 1.08;
  }
}

class PaymentProcessor {
  constructor(discountEngine, taxCalculator) {
    this.discountEngine = discountEngine;
    this.taxCalculator = taxCalculator;
  }
  charge(total, itemCount) {
    const discounted = this.discountEngine.applyDiscount(total, itemCount);
    const final = this.taxCalculator.calculate(discounted);
    console.log(`Charging $${final.toFixed(2)}`);
    return final;
  }
}

class CheckoutManager {
  constructor(cartManager, paymentProcessor) {
    this.cartManager = cartManager;
    this.paymentProcessor = paymentProcessor;
  }
  checkout() {
    const total = this.cartManager.getTotal();
    const itemCount = this.cartManager.getItems().length; // read here, passed as a value
    return this.paymentProcessor.charge(total, itemCount);
  }
}

// --- wiring, after the fix ---
const cart = new CartManager();
cart.addItem({ name: "Book", price: 20 });
cart.addItem({ name: "Pen", price: 3 });
cart.addItem({ name: "Mug", price: 12 });

const discountEngine = new DiscountEngine();               // no longer takes cartManager
const taxCalculator = new TaxCalculator();
const paymentProcessor = new PaymentProcessor(discountEngine, taxCalculator);
const checkout = new CheckoutManager(cart, paymentProcessor);

checkout.checkout();