import { handleFurnitureApi } from "./furniture/api";
import type { MatchEnv, WorkersAi } from "./furniture/types";

interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

export interface Env extends MatchEnv {
  ASSETS: AssetBinding;
  AI: WorkersAi;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/furniture/api" || pathname.startsWith("/furniture/api/")) {
      return handleFurnitureApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
