/**
 * Next.js App Router と public/ 静的 HTML の行き来
 *
 * router.push('/index.html') は App Router 上に存在しないパスとして 404 になるため、
 * .html への遷移はフルページロードで行う。
 */

/** public/ 配下の静的 HTML へ遷移するパスか */
export function isStaticHtmlPath(path: string): boolean {
  if (!path?.startsWith("/")) return false;
  return path.endsWith(".html");
}

/**
 * アプリ内遷移（静的 HTML は window.location を使用）
 * @param path 遷移先パス
 * @param router Next.js router（App 内ルート用。省略時は location のみ）
 */
export function navigateToAppPath(
  path: string,
  router?: { push: (href: string) => void; replace?: (href: string) => void },
  method: "push" | "replace" = "push"
) {
  if (typeof window === "undefined") return;

  if (isStaticHtmlPath(path)) {
    window.location.href = path;
    return;
  }

  if (router) {
    if (method === "replace" && router.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
    return;
  }

  window.location.href = path;
}
