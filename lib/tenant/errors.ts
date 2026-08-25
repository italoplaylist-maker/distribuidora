export class UnauthorizedError extends Error {
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Thrown whenever a record isn't found *scoped to the current company* — including when it belongs to another tenant. Never leaks whether the record exists elsewhere. */
export class NotFoundError extends Error {
  constructor(message = "Registro não encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Whether the company can currently perform write operations.
 * None of the three PAST_DUE behaviors (BLOCK_ALL, READ_ONLY, BLOCK_NEW_OPERATIONS)
 * permit writes — they only differ in whether reads are still allowed (see canRead).
 */
export function canWrite(company: { status: string; trialBehavior: string }): boolean {
  return company.status === "ACTIVE" || company.status === "TRIAL";
}

/** SUSPENDED/CANCELED always block reads; PAST_DUE blocks reads only under BLOCK_ALL. */
export function canRead(company: { status: string; trialBehavior?: string }): boolean {
  if (company.status === "SUSPENDED" || company.status === "CANCELED") return false;
  if (company.status === "PAST_DUE") return company.trialBehavior !== "BLOCK_ALL";
  return true;
}
