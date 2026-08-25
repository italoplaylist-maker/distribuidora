import { CompanyRole, UserType } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    userType: UserType;
    companyId: string | null;
    role: CompanyRole | null;
  }

  interface Session {
    user: {
      id: string;
      userType: UserType;
      companyId: string | null;
      role: CompanyRole | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: UserType;
    companyId: string | null;
    role: CompanyRole | null;
  }
}
