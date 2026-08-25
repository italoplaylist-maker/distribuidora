import { describe, it, expect } from "vitest";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { canWrite, canRead } from "@/lib/tenant/errors";

describe("roleHasPermission", () => {
  it("gives ADMINISTRADOR every permission", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(roleHasPermission("ADMINISTRADOR", permission)).toBe(true);
    }
  });

  it("denies VENDEDOR access to financeiro", () => {
    expect(roleHasPermission("VENDEDOR", PERMISSIONS.FINANCE_VIEW)).toBe(false);
    expect(roleHasPermission("VENDEDOR", PERMISSIONS.FINANCE_PAY)).toBe(false);
  });

  it("allows VENDEDOR to create sales", () => {
    expect(roleHasPermission("VENDEDOR", PERMISSIONS.SALES_CREATE)).toBe(true);
  });

  it("denies ESTOQUISTA access to cancelling sales", () => {
    expect(roleHasPermission("ESTOQUISTA", PERMISSIONS.SALES_CANCEL)).toBe(false);
  });

  it("allows ESTOQUISTA to adjust stock", () => {
    expect(roleHasPermission("ESTOQUISTA", PERMISSIONS.STOCK_ADJUST)).toBe(true);
  });

  it("denies GERENTE access to user management and company settings", () => {
    expect(roleHasPermission("GERENTE", PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(roleHasPermission("GERENTE", PERMISSIONS.COMPANY_SETTINGS)).toBe(false);
  });

  it("restricts MOTORISTA to deliveries only", () => {
    expect(roleHasPermission("MOTORISTA", PERMISSIONS.DELIVERIES_VIEW)).toBe(true);
    expect(roleHasPermission("MOTORISTA", PERMISSIONS.DELIVERIES_MANAGE)).toBe(true);
    expect(roleHasPermission("MOTORISTA", PERMISSIONS.SALES_VIEW)).toBe(false);
    expect(roleHasPermission("MOTORISTA", PERMISSIONS.PRODUCTS_VIEW)).toBe(false);
  });

  it("returns false for null role", () => {
    expect(roleHasPermission(null, PERMISSIONS.PRODUCTS_VIEW)).toBe(false);
    expect(roleHasPermission(undefined, PERMISSIONS.PRODUCTS_VIEW)).toBe(false);
  });
});

describe("company billing gates (canWrite / canRead)", () => {
  it("allows writes while TRIAL or ACTIVE", () => {
    expect(canWrite({ status: "TRIAL", trialBehavior: "READ_ONLY" })).toBe(true);
    expect(canWrite({ status: "ACTIVE", trialBehavior: "READ_ONLY" })).toBe(true);
  });

  it("blocks writes for SUSPENDED and CANCELED companies", () => {
    expect(canWrite({ status: "SUSPENDED", trialBehavior: "READ_ONLY" })).toBe(false);
    expect(canWrite({ status: "CANCELED", trialBehavior: "READ_ONLY" })).toBe(false);
  });

  it("never allows writes for PAST_DUE, regardless of trialBehavior", () => {
    expect(canWrite({ status: "PAST_DUE", trialBehavior: "READ_ONLY" })).toBe(false);
    expect(canWrite({ status: "PAST_DUE", trialBehavior: "BLOCK_NEW_OPERATIONS" })).toBe(false);
    expect(canWrite({ status: "PAST_DUE", trialBehavior: "BLOCK_ALL" })).toBe(false);
  });

  it("blocks reads for SUSPENDED/CANCELED, and for PAST_DUE only under BLOCK_ALL", () => {
    expect(canRead({ status: "TRIAL" })).toBe(true);
    expect(canRead({ status: "ACTIVE" })).toBe(true);
    expect(canRead({ status: "PAST_DUE", trialBehavior: "READ_ONLY" })).toBe(true);
    expect(canRead({ status: "PAST_DUE", trialBehavior: "BLOCK_NEW_OPERATIONS" })).toBe(true);
    expect(canRead({ status: "PAST_DUE", trialBehavior: "BLOCK_ALL" })).toBe(false);
    expect(canRead({ status: "SUSPENDED" })).toBe(false);
    expect(canRead({ status: "CANCELED" })).toBe(false);
  });
});
