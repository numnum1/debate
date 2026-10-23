/** Fehler vom Backend; `code` ist der fachliche Code aus dem ProblemDetail, z. B. „MUTED“. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly body: Record<string, unknown>

  constructor(status: number, code: string | undefined, message: string, body: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.body = body
  }
}

type Options = { token?: string; method?: 'GET' | 'POST'; body?: unknown }

/** Ruft das Backend über den Vite-Proxy auf, mit Token, falls angemeldet. */
export async function api<T>(path: string, { token, method = 'GET', body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : undefined
  if (!res.ok) {
    const problem = (json ?? {}) as Record<string, unknown>
    const detail = typeof problem.detail === 'string' ? problem.detail : `Backend antwortet mit ${res.status}`
    throw new ApiError(res.status, problem.code as string | undefined, detail, problem)
  }
  return json as T
}
