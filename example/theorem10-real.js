// ============================================================
// A real chain: ReportGenerator -> Formatter -> Aggregator -> RawDataStore
//
// RawDataStore  (D) = lowest level, holds raw records, no dependencies
// Aggregator    (C) = groups/sums raw records
// Formatter     (B) = turns aggregated numbers into display strings
// ReportGenerator (A) = produces the final report text
// ============================================================

class RawDataStore {
  #records = [
    { region: "west", amount: 120 },
    { region: "west", amount: 80 },
    { region: "east", amount: 200 },
  ];

  getRecords() {          // C(D) function #1
    return this.#records;
  }

  getRecordCount() {      // C(D) function #2 — NEVER CALLED by anything below
    return this.#records.length;
  }
}

class Aggregator {
  constructor(store) {
    this.store = store; // Aggregator -> RawDataStore (real edge)
  }

  totalsByRegion() {     // C(C) function #1
    const records = this.store.getRecords();   // uses D's getRecords
    const totals = {};
    for (const r of records) {
      totals[r.region] = (totals[r.region] || 0) + r.amount;
    }
    return totals;
  }

  averagePerRecord() {   // C(C) function #2 — now also uses getRecordCount
    const records = this.store.getRecords();
    const count = this.store.getRecordCount(); // NOW USED
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    return count === 0 ? 0 : total / count;
  }
}

class Formatter {
  constructor(aggregator) {
    this.aggregator = aggregator; // Formatter -> Aggregator (real edge)
  }

  formatSummary() {      // C(B) function #1
    const totals = this.aggregator.totalsByRegion();
    const avg = this.aggregator.averagePerRecord(); // now also uses this
    const lines = Object.entries(totals).map(([region, amount]) => `${region}: $${amount}`);
    return `${lines.join(", ")} (avg per record: $${avg.toFixed(2)})`;
  }
}

class ReportGenerator {
  constructor(formatter) {
    this.formatter = formatter; // ReportGenerator -> Formatter (real edge)
  }

  buildReport() {         // C(A) function #1
    const summary = this.formatter.formatSummary();
    return `=== Sales Report ===\n${summary}`;
  }
}

// --- run it ---
const store = new RawDataStore();
const aggregator = new Aggregator(store);
const formatter = new Formatter(aggregator);
const report = new ReportGenerator(formatter);

console.log(report.buildReport());