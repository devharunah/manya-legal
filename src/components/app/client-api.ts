"use client";

/** Browser-side fetch for MANYA's own API. Throws ApiError with the server's message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  url: string,
  init?: { method?: string; body?: unknown; form?: FormData },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? (init?.body || init?.form ? "POST" : "GET"),
      ...(init?.form
        ? { body: init.form }
        : init?.body !== undefined
          ? { body: JSON.stringify(init.body), headers: { "content-type": "application/json" } }
          : {}),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("We couldn't reach MANYA. Check your connection and try again.", 0);
  }
  const data = res.headers.get("content-type")?.includes("application/json")
    ? ((await res.json()) as unknown)
    : null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "";
    throw new ApiError(message || "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}
