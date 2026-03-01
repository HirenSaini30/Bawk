function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  return atob(padded);
}

function projectRefFromAnonKey(anonKey: string): string | null {
  try {
    const [, payload] = anonKey.split(".");
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(decodeBase64Url(payload));
    return typeof decoded.ref === "string" ? decoded.ref : null;
  } catch {
    return null;
  }
}

function resolveSupabaseUrl(rawUrl: string | undefined, anonKey: string): string {
  const trimmed = rawUrl?.trim();

  if (trimmed) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
        return url.toString().replace(/\/$/, "");
      }
    } catch {
      // Fall back to deriving the project URL from the anon key below.
    }
  }

  const projectRef = projectRefFromAnonKey(anonKey);
  if (projectRef) {
    return `https://${projectRef}.supabase.co`;
  }

  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL must be your Supabase Project URL, for example https://<project-ref>.supabase.co"
  );
}

const supabaseAnonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const env = {
  supabaseUrl: resolveSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey
  ),
  supabaseAnonKey,
  apiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000",
};
