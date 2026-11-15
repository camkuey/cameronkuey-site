export interface InstallHintInput {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone: boolean;
}

/** iPhone/iPad Safari, and only when the page is not already installed. */
export function shouldShowInstallHint(input: InstallHintInput): boolean {
  if (input.standalone) return false;
  const ua = input.userAgent;
  const iOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (input.platform === "MacIntel" && input.maxTouchPoints > 1);
  if (!iOS) return false;
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//i.test(ua);
  return /Safari/i.test(ua) && !otherBrowser;
}
