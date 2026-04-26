import { LoginForm } from "@/components/login-form";

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
    return "/admin/dashboard";
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(getFirstParam(params.callbackUrl));
  const registered = getFirstParam(params.registered) === "1";
  const reason = getFirstParam(params.reason);
  const authError = getFirstParam(params.error);

  return (
    <div className="max-w-5xl min-w-0" style={{ width: "min(calc(100vw - 2rem), 64rem)" }}>
      <LoginForm
        callbackUrl={callbackUrl}
        registered={registered}
        reason={reason}
        authError={authError}
      />
    </div>
  );
}
