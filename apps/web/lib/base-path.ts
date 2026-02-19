function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const APP_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

export function withBasePath(path: string, basePath: string = APP_BASE_PATH): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBasePath = normalizeBasePath(basePath);

  if (!normalizedBasePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return normalizedBasePath;
  }

  return `${normalizedBasePath}${normalizedPath}`;
}

export function getBasePath(): string {
  return APP_BASE_PATH;
}
