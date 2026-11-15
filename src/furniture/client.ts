import { shouldShowInstallHint } from "./install-hint";
import type { Closeness, MatchResponse, ProductMatch, StatusResponse } from "./types";

const MAX_EDGE = 768;
const MAX_BYTES = 160_000;

const CLOSENESS_LABEL: Record<Closeness, string> = {
  exact: "Exact",
  visual: "Closest",
  similar: "Similar",
};

export function mountFurnitureMatch(): void {
  const root = document.querySelector<HTMLElement>("[data-screen]");
  if (!root) return;

  const camera = document.querySelector<HTMLInputElement>("#camera-input");
  const library = document.querySelector<HTMLInputElement>("#library-input");
  const takePhoto = document.querySelector<HTMLButtonElement>("#take-photo");
  const chooseLibrary = document.querySelector<HTMLButtonElement>("#choose-library");
  const restart = document.querySelector<HTMLButtonElement>("#restart");
  const retry = document.querySelector<HTMLButtonElement>("#retry");
  const notice = document.querySelector<HTMLElement>("#notice");
  const install = document.querySelector<HTMLElement>("#install-hint");
  const dismissInstall = document.querySelector<HTMLButtonElement>("#dismiss-install");
  const preview = document.querySelector<HTMLImageElement>("#preview");
  const description = document.querySelector<HTMLElement>("#description");
  const range = document.querySelector<HTMLElement>("#price-range");
  const count = document.querySelector<HTMLElement>("#result-count");
  const list = document.querySelector<HTMLElement>("#results");
  const empty = document.querySelector<HTMLElement>("#empty");
  const errorText = document.querySelector<HTMLElement>("#error-text");
  const loadingCaption = document.querySelector<HTMLElement>("#loading-caption");

  if (!camera || !library || !takePhoto || !chooseLibrary || !restart || !retry || !list) return;

  let previewUrl = "";
  let lastBlob: Blob | null = null;
  let controller: AbortController | null = null;
  let entryId = "";
  let accurate = "";
  let which = "";
  let logTask: Promise<void> = Promise.resolve();
  const accuracy = document.querySelector<HTMLElement>("#accuracy");
  const accuracyNote = document.querySelector<HTMLElement>("#accuracy-note");

  const setState = (state: "idle" | "loading" | "results" | "error") => {
    root.dataset.state = state;
    restart.hidden = state === "idle";
  };

  takePhoto.addEventListener("click", () => camera.click());
  chooseLibrary.addEventListener("click", () => library.click());
  camera.addEventListener("change", () => consume(camera.files?.[0] ?? null));
  library.addEventListener("change", () => consume(library.files?.[0] ?? null));
  restart.addEventListener("click", () => {
    controller?.abort();
    lastBlob = null;
    entryId = "";
    accurate = "";
    which = "";
    logTask = Promise.resolve();
    if (accuracy) accuracy.hidden = true;
    clearPreview();
    setState("idle");
  });
  accuracy?.querySelectorAll<HTMLButtonElement>("[data-accurate]").forEach((button) => {
    button.addEventListener("click", () => {
      accurate = button.dataset.accurate || "";
      accuracy.querySelectorAll<HTMLButtonElement>("[data-accurate]").forEach((other) => {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      void saveAccuracy();
    });
  });
  retry.addEventListener("click", () => {
    if (lastBlob) void search(lastBlob);
  });

  if (install && shouldShowInstallHint(readHintInput()) && sessionStorage.getItem("furniture-match-hide-hint") !== "1") {
    install.hidden = false;
  }
  dismissInstall?.addEventListener("click", () => {
    if (install) install.hidden = true;
    sessionStorage.setItem("furniture-match-hide-hint", "1");
  });

  void loadStatus(notice);
  registerServiceWorker();

  async function consume(file: File | null): Promise<void> {
    camera.value = "";
    library.value = "";
    if (!file) return;
    setState("loading");
    if (loadingCaption) loadingCaption.textContent = "Preparing the photo";
    try {
      const blob = await compressImage(file);
      lastBlob = blob;
      showPreview(blob);
      await search(blob);
    } catch (error) {
      showError(error instanceof Error ? error.message : "That photo could not be prepared.");
    }
  }

  async function search(blob: Blob): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    setState("loading");
    if (loadingCaption) loadingCaption.textContent = "Matching this piece";
    const body = new FormData();
    body.set("photo", blob, "furniture.jpg");
    try {
      const response = await fetch("/furniture/api/match", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as MatchResponse | { error?: string } | null;
      if (!response.ok) {
        showError(payload && "error" in payload && payload.error ? payload.error : "The search did not finish.");
        return;
      }
      if (!payload || !("results" in payload)) {
        showError("The search did not finish.");
        return;
      }
      renderResults(payload);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showError("The search did not finish. Check your connection and try again.");
    }
  }

  function renderResults(payload: MatchResponse): void {
    if (description) description.textContent = payload.description;
    if (range) {
      range.hidden = !payload.priceRange;
      range.textContent = payload.priceRange ? payload.priceRange.label : "";
    }
    if (count) {
      const noun = payload.results.length === 1 ? "match" : "matches";
      count.textContent = payload.results.length ? `${payload.results.length} ${noun}, closest first` : "";
    }
    if (notice) {
      notice.hidden = !payload.notice;
      notice.textContent = payload.notice ?? "";
    }
    list.replaceChildren();
    entryId = payload.mode === "live" && payload.entryId ? payload.entryId : "";
    accurate = "";
    which = "";
    const track = Boolean(entryId);
    for (const product of payload.results) list.append(renderCard(product, track ? markWhich : null));
    if (empty) empty.hidden = payload.results.length > 0;
    if (accuracy) {
      accuracy.hidden = !track;
      accuracy.querySelectorAll<HTMLButtonElement>("[data-accurate]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    }
    if (accuracyNote) accuracyNote.hidden = true;
    setState("results");
    if (track && lastBlob) logTask = sendSearchLog(payload, lastBlob);
  }

  function markWhich(name: string, button: HTMLButtonElement): void {
    which = name;
    list.querySelectorAll<HTMLButtonElement>(".pick").forEach((other) => {
      other.setAttribute("aria-pressed", other === button ? "true" : "false");
    });
    void saveAccuracy();
  }

  async function saveAccuracy(): Promise<void> {
    if (!entryId) return;
    await logTask.catch(() => undefined);
    const saved = await postLog("accuracy", { action: "accuracy", entryId, accurate, which });
    if (saved && accuracyNote) {
      accuracyNote.hidden = false;
      accuracyNote.textContent = "Saved";
    }
  }

  function showError(message: string): void {
    if (errorText) errorText.textContent = message;
    setState("error");
  }

  function showPreview(blob: Blob): void {
    clearPreview();
    previewUrl = URL.createObjectURL(blob);
    if (preview) {
      preview.src = previewUrl;
      preview.hidden = false;
    }
  }

  function clearPreview(): void {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    if (preview) {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
  }
}

async function sendSearchLog(payload: MatchResponse, photo: Blob): Promise<void> {
  if (payload.mode !== "live" || !payload.entryId) return;
  const top = payload.results.slice(0, 5).map((result) => ({
    name: result.name,
    store: result.store,
    priceLabel: result.priceLabel,
    url: result.url,
  }));
  await postLog("search", {
    action: "search",
    entryId: payload.entryId,
    mode: "live",
    description: payload.description,
    query: payload.query ?? "",
    resultCount: payload.results.length,
    priceRange: payload.priceRange?.label ?? "",
    results: top,
    photo: await blobToBase64(photo),
    mime: "image/jpeg",
  });
}

async function postLog(action: "search" | "accuracy", body: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch("/furniture/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Log-Action": action,
        "X-Match-Mode": "live",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    const payload = (await response.json().catch(() => null)) as { logged?: boolean } | null;
    return payload?.logged === true;
  } catch {
    /* The sheet is a record. A missed row should not change the search. */
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const size = 0x8000;
    for (let index = 0; index < bytes.length; index += size) {
      binary += String.fromCharCode(...bytes.subarray(index, index + size));
    }
    return btoa(binary);
  });
}

function renderCard(product: ProductMatch, onPick: ((name: string, button: HTMLButtonElement) => void) | null): HTMLElement {
  const card = document.createElement("article");
  card.className = "card";

  const figure = document.createElement("div");
  figure.className = "card-photo";
  const imageUrl = safeImage(product.image);
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `${product.name} from ${product.store}`;
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      img.replaceWith(fallbackMark(product.store));
    });
    figure.append(img);
  } else {
    figure.append(fallbackMark(product.store));
  }

  const body = document.createElement("div");
  body.className = "card-body";
  const label = document.createElement("p");
  label.className = `closeness closeness-${product.closeness}`;
  label.textContent = CLOSENESS_LABEL[product.closeness];
  const title = document.createElement("h2");
  title.textContent = product.name;
  const store = document.createElement("p");
  store.className = "store";
  store.textContent = product.store;
  const price = document.createElement("p");
  price.className = "price";
  price.textContent = product.priceLabel || "Price on the site";
  body.append(label, title, store, price);

  const href = safeLink(product.url);
  if (href) {
    const link = document.createElement("a");
    link.className = "btn solid";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `Buy at ${product.store}`;
    body.append(link);
  }

  if (onPick) {
    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "pick";
    pick.textContent = "This one";
    pick.setAttribute("aria-pressed", "false");
    pick.addEventListener("click", () => onPick(product.name, pick));
    body.append(pick);
  }

  card.append(figure, body);
  return card;
}

function fallbackMark(store: string): HTMLElement {
  const mark = document.createElement("div");
  mark.className = "photo-fallback";
  mark.textContent = store.slice(0, 1).toUpperCase();
  return mark;
}

function safeLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function safeImage(url: string): string | null {
  if (url.startsWith("/furniture/")) return url;
  return safeLink(url);
}

async function loadStatus(notice: HTMLElement | null): Promise<void> {
  if (!notice) return;
  try {
    const response = await fetch("/furniture/api/status");
    if (!response.ok) return;
    const status = (await response.json()) as StatusResponse;
    if (!status.message) return;
    notice.hidden = false;
    notice.textContent = status.message;
  } catch {
    /* The match request reports mode again if this check fails. */
  }
}

function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (!location.pathname.startsWith("/furniture/")) return;
  navigator.serviceWorker.register("/furniture/sw.js", { scope: "/furniture/" }).catch(() => {});
}

function readHintInput(): { userAgent: string; platform: string; maxTouchPoints: number; standalone: boolean } {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone,
  };
}

async function compressImage(file: File): Promise<Blob> {
  const decoded = await decodeImage(file);
  const sourceWidth = "naturalWidth" in decoded ? decoded.naturalWidth : decoded.width;
  const sourceHeight = "naturalHeight" in decoded ? decoded.naturalHeight : decoded.height;
  if (!sourceWidth || !sourceHeight) throw new Error("This photo format did not open. Try another shot.");

  let edge = MAX_EDGE;
  let quality = 0.72;
  let blob = await renderJpeg(decoded, sourceWidth, sourceHeight, edge, quality);
  while (blob.size > MAX_BYTES && (quality > 0.45 || edge > 720)) {
    if (quality > 0.45) quality -= 0.08;
    else edge = Math.round(edge * 0.8);
    blob = await renderJpeg(decoded, sourceWidth, sourceHeight, edge, quality);
  }
  if ("close" in decoded) decoded.close();
  if (blob.size > MAX_BYTES) throw new Error("That photo is still too large. Try another shot.");
  return blob;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error("This photo format did not open. Try another shot.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function renderJpeg(
  image: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("This browser could not prepare the photo."));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("This photo could not be prepared."))),
      "image/jpeg",
      quality,
    );
  });
}
