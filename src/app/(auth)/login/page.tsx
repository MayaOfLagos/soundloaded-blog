import { UserLoginForm } from "@/components/user-login-form";

type SearchParams = Promise<{
  callbackUrl?: string | string[];
  registered?: string | string[];
  reason?: string | string[];
  error?: string | string[];
}>;

function getFirstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function getSafeCallbackUrl(callbackUrl: string | null): string {
  if (!callbackUrl?.startsWith("/")) {
    return "/dashboard";
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(getFirstParam(params.callbackUrl));
  const registered = getFirstParam(params.registered) === "1";
  const reason = getFirstParam(params.reason);
  const authError = getFirstParam(params.error);
  const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <UserLoginForm
      callbackUrl={callbackUrl}
      registered={registered}
      reason={reason}
      authError={authError}
      googleEnabled={googleEnabled}
    />
  );
}
