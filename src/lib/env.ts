export function isDevEnvironment(): boolean {
  const explicitDbEnv = process.env.DB_ENV?.toLowerCase();
  if (explicitDbEnv === "prod" || explicitDbEnv === "production") return false;
  if (explicitDbEnv === "dev" || explicitDbEnv === "development") return true;

  const isVercel = Boolean(process.env.VERCEL);
  const vercelEnv = process.env.VERCEL_ENV;
  if (isVercel && vercelEnv === "production") return false;

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.includes("-dev") || dbUrl.includes("dev-") || dbUrl.includes("/dev")) return true;

  return process.env.NODE_ENV !== "production" || !isVercel;
}

export function getTitlePrefix(): string {
  return isDevEnvironment() ? "[Dev] " : "";
}
