// ============================================================
// VIOLATION: PaymentHandler and InventoryHandler are Siblings
// under OrderProcessor (~OrderProcessor = {PaymentHandler,
// InventoryHandler}) — but PaymentHandler secretly depends on
// InventoryHandler directly. This is a hidden Sibling->Sibling
// edge, which forces a skip-level violation (Axiom 2).
// ============================================================

class InventoryHandler {
  hasStock(orderId) {
    // pretend this checks a warehouse DB
    return true;
  }
}

class PaymentHandler {
  constructor(inventoryHandler) {
    this.inventoryHandler = inventoryHandler; // <-- hidden edge: PaymentHandler -> InventoryHandler
  }

  charge(orderId, amount) {
    if (!this.inventoryHandler.hasStock(orderId)) {
      throw new Error("Cannot charge — out of stock");
    }
    console.log(`Charged $${amount} for order ${orderId}`);
  }
}

class OrderProcessor {
  constructor(paymentHandler, inventoryHandler) {
    this.paymentHandler = paymentHandler;       // OrderProcessor -> PaymentHandler
    this.inventoryHandler = inventoryHandler;   // OrderProcessor -> InventoryHandler
  }

  process(orderId, amount) {
    this.paymentHandler.charge(orderId, amount);
  }
}

// Graph that results:
//   OrderProcessor -> PaymentHandler
//   OrderProcessor -> InventoryHandler
//   PaymentHandler -> InventoryHandler   <-- hidden edge
//
// OrderProcessor -> PaymentHandler -> InventoryHandler (a path)
// PLUS a direct OrderProcessor -> InventoryHandler edge
// = skip-level violation (Axiom 2), even though nobody wrote
// OrderProcessor -> InventoryHandler -> PaymentHandler as a "skip"
// on purpose. It emerged from PaymentHandler quietly reaching
// sideways into its own Sibling.


// ============================================================
// FIX: apply the Dependency Test to PaymentHandler.
// Does "charge a customer" require InventoryHandler to EXIST,
// or does it only need a plain stock-availability VALUE?
// -> Just a value. So pass the value in, don't hand over the
//    Node. PaymentHandler->InventoryHandler is deleted entirely.
// Sibling status is restored: neither can reach the other.
// ============================================================

class PaymentHandlerFixed {
  charge(orderId, amount, inStock) {   // <-- plain boolean in, not a Node reference
    if (!inStock) {
      throw new Error("Cannot charge — out of stock");
    }
    console.log(`Charged $${amount} for order ${orderId}`);
  }
}

class OrderProcessorFixed {
  constructor(paymentHandler, inventoryHandler) {
    this.paymentHandler = paymentHandler;
    this.inventoryHandler = inventoryHandler;
  }

  process(orderId, amount) {
    const inStock = this.inventoryHandler.hasStock(orderId); // OrderProcessor checks first
    this.paymentHandler.charge(orderId, amount, inStock);    // hands PaymentHandler a value, not a Node
  }
}

// Graph that results:
//   OrderProcessor -> PaymentHandler
//   OrderProcessor -> InventoryHandler
//   (no edge between PaymentHandler and InventoryHandler)
//
// ~OrderProcessor = {PaymentHandler, InventoryHandler} — real
// Siblings again. Changing InventoryHandler's internals can
// never ripple directly into PaymentHandler, or vice versa —
// only through OrderProcessor's contract (the shielding theorem).


// --- quick run to show both behave the same at runtime ---
const inv = new InventoryHandler();
new OrderProcessor(new PaymentHandler(inv), inv).process("A1", 42);
new OrderProcessorFixed(new PaymentHandlerFixed(), inv).process("A2", 42);