import { ScoutProviderError } from "./errors.js";

export class BudgetGuard {
  constructor(limitUsd) {
    this.limitUsd = Number.isFinite(limitUsd) ? limitUsd : Infinity;
    this.reservedUsd = 0;
    this.reportedUsd = 0;
  }

  reserve(amountUsd, operation) {
    const amount = Number(amountUsd);
    if (!Number.isFinite(amount) || amount < 0) throw new TypeError("Budget reservation must be a non-negative number");
    if (this.reservedUsd + amount > this.limitUsd + Number.EPSILON) {
      throw new ScoutProviderError("BUDGET_EXHAUSTED", `Estimated cost for ${operation} exceeds the execution budget.`, {
        retryable: false,
        details: { operation, limit_usd: this.limitUsd, reserved_usd: this.reservedUsd, requested_usd: amount }
      });
    }
    this.reservedUsd += amount;
  }

  report(amountUsd) {
    const amount = Number(amountUsd);
    if (Number.isFinite(amount) && amount >= 0) this.reportedUsd += amount;
  }

  snapshot() {
    return { limit_usd: this.limitUsd, reserved_usd: this.reservedUsd, reported_usd: this.reportedUsd };
  }
}
