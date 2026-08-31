// ============================================================
// Testing whether Interface Wrap generalizes to the case where
// the SOURCE is an existing Interface Layer member (not a whole
// Node), that then needs a NEW doorway built for a different
// consumer with a different need.
// ============================================================

// Scenario: RiskEngine used to expose "score" publicly for
// ONE consumer's purpose. A second consumer (Auditor) now
// needs the SAME underlying computation, but wants it exposed
// with different semantics (a formatted report, not a raw number).

class RiskEngine {
  // Originally: score() was the ONLY public entry point.
  // Now: score's raw computation is demoted to a private sub-layer,
  // because BOTH consumers actually want a wrapper around it,
  // not the raw number itself, for different reasons.
  #computeRisk(signal) {
    let risk = 0.5;
    if (signal < 600) risk += 0.3;
    if (signal > 750) risk -= 0.2;
    return risk;
  }

  // Doorway #1: original consumer's need (a plain risk number)
  score(signal) {
    return this.#computeRisk(signal);
  }

  // Doorway #2: NEW consumer's need (a formatted audit report) --
  // this is the "new interface" being wrapped around the SAME
  // demoted sub-layer, for a genuinely different purpose.
  auditReport(signal) {
    const risk = this.#computeRisk(signal);
    return `Risk assessment: ${(risk * 100).toFixed(1)}% (signal=${signal})`;
  }
}

class PaymentFlow {
  constructor(riskEngine) { this.riskEngine = riskEngine; }
  charge(signal) { return this.riskEngine.score(signal); }
}

class Auditor {
  constructor(riskEngine) { this.riskEngine = riskEngine; }
  review(signal) { return this.riskEngine.auditReport(signal); }
}

const riskEngine = new RiskEngine();
const payment = new PaymentFlow(riskEngine);
const auditor = new Auditor(riskEngine);

console.log("Payment:", payment.charge(720));
console.log("Audit:", auditor.review(720));