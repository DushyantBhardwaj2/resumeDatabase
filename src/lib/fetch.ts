export default async function fetchWithSession(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const { headers: nextHeaders } = await import("next/headers")
  const h = await nextHeaders()
  const cookie = h.get("cookie") || ""

  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      cookie,
    } as HeadersInit,
  })
}
