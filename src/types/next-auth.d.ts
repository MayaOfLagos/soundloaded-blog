import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    artistProfileId?: string | null;
    labelProfileId?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role?: string;
      artistProfileId?: string | null;
      labelProfileId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    artistProfileId?: string | null;
    labelProfileId?: string | null;
  }
}
