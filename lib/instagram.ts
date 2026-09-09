// Wrapper minimale sulla Instagram Graph API ufficiale (Meta), percorso
// "Facebook Login for Business" — host graph.facebook.com, permessi
// pages_show_list / pages_read_engagement / instagram_basic / instagram_content_publish.
//
// Non usare i permessi instagram_business_* (percorso alternativo "Instagram
// API with Instagram Login", host graph.instagram.com): mischiare i due dà
// "Invalid platform app".

const GRAPH_API_VERSION = "v20.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramApiError extends Error {
  constructor(message: string, public readonly response?: unknown) {
    super(message);
    this.name = "InstagramApiError";
  }
}

async function graphRequest<T>(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);

  let response: Response;
  if (method === "GET") {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    response = await fetch(url.toString(), { method: "GET" });
  } else {
    const body = new URLSearchParams(params);
    response = await fetch(url.toString(), { method: "POST", body });
  }

  const json = (await response.json()) as any;
  if (!response.ok || json?.error) {
    throw new InstagramApiError(
      json?.error?.message ?? `Errore Graph API (HTTP ${response.status})`,
      json
    );
  }
  return json as T;
}

interface CreateContainerResult {
  id: string;
}

/** Crea un container per una singola immagine (post normale o slide di un carosello). */
async function createImageContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  opts: { caption?: string; isCarouselItem?: boolean } = {}
): Promise<string> {
  const params: Record<string, string> = {
    image_url: imageUrl,
    access_token: accessToken,
  };
  if (opts.caption) params.caption = opts.caption;
  if (opts.isCarouselItem) params.is_carousel_item = "true";

  const result = await graphRequest<CreateContainerResult>(
    `/${igUserId}/media`,
    params,
    "POST"
  );
  return result.id;
}

/** Crea il container "genitore" di un carosello a partire dagli id delle slide. */
async function createCarouselContainer(
  igUserId: string,
  accessToken: string,
  childrenIds: string[],
  caption: string
): Promise<string> {
  const result = await graphRequest<CreateContainerResult>(
    `/${igUserId}/media`,
    {
      media_type: "CAROUSEL",
      children: childrenIds.join(","),
      caption,
      access_token: accessToken,
    },
    "POST"
  );
  return result.id;
}

interface ContainerStatus {
  status_code: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
}

/** Fa polling sullo stato di un container finché non è pronto (FINISHED) o va in errore. */
async function waitUntilContainerReady(
  containerId: string,
  accessToken: string,
  { intervalMs = 2000, timeoutMs = 60000 } = {}
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await graphRequest<ContainerStatus>(`/${containerId}`, {
      fields: "status_code",
      access_token: accessToken,
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new InstagramApiError(
        `Container ${containerId} in stato ${status.status_code}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new InstagramApiError(
    `Timeout in attesa che il container ${containerId} sia pronto`
  );
}

interface PublishResult {
  id: string;
}

async function publishContainer(
  igUserId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const result = await graphRequest<PublishResult>(
    `/${igUserId}/media_publish`,
    { creation_id: creationId, access_token: accessToken },
    "POST"
  );
  return result.id;
}

async function getPermalink(mediaId: string, accessToken: string): Promise<string | null> {
  const result = await graphRequest<{ permalink?: string }>(`/${mediaId}`, {
    fields: "permalink",
    access_token: accessToken,
  });
  return result.permalink ?? null;
}

export interface PublishPostParams {
  igUserId: string;
  accessToken: string;
  caption: string;
  imageUrls: string[];
}

export interface PublishPostResult {
  mediaId: string;
  permalink: string | null;
}

/**
 * Pubblica un post su Instagram: singola immagine se imageUrls ha un solo
 * elemento, carosello (fino a 10 slide) altrimenti.
 */
export async function publishPost({
  igUserId,
  accessToken,
  caption,
  imageUrls,
}: PublishPostParams): Promise<PublishPostResult> {
  if (imageUrls.length === 0) {
    throw new InstagramApiError("Nessuna immagine fornita per il post");
  }
  if (imageUrls.length > 10) {
    throw new InstagramApiError("Un carosello Instagram supporta al massimo 10 slide");
  }

  let creationId: string;

  if (imageUrls.length === 1) {
    creationId = await createImageContainer(igUserId, accessToken, imageUrls[0], {
      caption,
    });
    await waitUntilContainerReady(creationId, accessToken);
  } else {
    const childrenIds = await Promise.all(
      imageUrls.map((url) =>
        createImageContainer(igUserId, accessToken, url, { isCarouselItem: true })
      )
    );
    creationId = await createCarouselContainer(igUserId, accessToken, childrenIds, caption);
    await waitUntilContainerReady(creationId, accessToken);
  }

  const mediaId = await publishContainer(igUserId, accessToken, creationId);
  const permalink = await getPermalink(mediaId, accessToken);

  return { mediaId, permalink };
}

interface DebugTokenResult {
  data: {
    is_valid: boolean;
    expires_at: number; // unix timestamp, 0 = non scade
    scopes: string[];
  };
}

/** Interroga /debug_token per sapere quando scade davvero il token corrente. */
export async function debugToken(
  inputToken: string,
  appId: string,
  appSecret: string
): Promise<DebugTokenResult["data"]> {
  const result = await graphRequest<DebugTokenResult>("/debug_token", {
    input_token: inputToken,
    access_token: `${appId}|${appSecret}`,
  });
  return result.data;
}
