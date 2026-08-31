// ============================================================
// Fix: the diamond is built INSIDE CreditValidator's own 
// Composition. #score becomes a private sub-layer, and
// TWO separate public members (check, getScore) each 
// independently depend on it.
// 
// The old name "CreditValidator" undersold what this Node
// actually does: it hosts a general-purpose risk-scoring
// capability (#score), and "check" is just ONE specific
// application of that capability (to a credit signal).
// getScore is the raw capability itself, re-exposed honestly.
//
// Renamed: CreditValidator -> RiskScoringService
// "check" kept, since it's still an honest, specific use:
// "adjusts a credit score based on fraud risk"
// "getScore" kept, since it's already honestly named:
// "scores an arbitrary signal for fraud risk"
// ============================================================

class RiskScoringService {
  // Interface Layer member #1: a SPECIFIC application of scoring,
  // to credit signals -- adjusts a credit score based on risk.
  check(customerId) {
    const rawScore = 720;
    const fraud = this.#score(customerId, rawScore);
    const adjustedScore = fraud.risk > 0.6 ? rawScore - 50 : rawScore;
    return { customerId, creditScore: adjustedScore };
  }

  // Interface Layer member #2: the GENERAL capability itself,
  // honestly re-exposed -- scores any signal for fraud risk.
  // This is the minimum legal indirection required by the
  // Black-Box Property: #score can never be reached directly,
  // so this thin wrapper IS the legitimate door in, not
  // redundant indirection (Theorem 6, Interface Wrap corollary).
  getScore(customerId, baseSignal) {
    return this.#score(customerId, baseSignal);
  }

  // Private sub-layer: the actual scoring computation.
  // Never reachable except through check() or getScore().
  #score(customerId, baseSignal) {
    let risk = 0.5;
    if (baseSignal < 600) risk += 0.3;
    if (baseSignal > 750) risk -= 0.2;
    return { customerId, risk };
  }
}

class OrderApprover {
  constructor(riskScoringService) {
    this.riskScoringService = riskScoringService; // A -> B, ONE edge, nothing else
  }
  approve(customerId) {
    const creditResult = this.riskScoringService.check(customerId);
    const orderAmount = 5000;
    const orderFraud = this.riskScoringService.getScore(customerId, orderAmount);
    const approved = creditResult.creditScore > 650 && orderFraud.risk < 0.6;
    return { customerId, creditScore: creditResult.creditScore, orderFraudRisk: orderFraud.risk, approved };
  }
}

const riskScoringService = new RiskScoringService();
const approver = new OrderApprover(riskScoringService);
console.log(approver.approve("cust-1"));
