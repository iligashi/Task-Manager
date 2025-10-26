"use client"

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  return localStorage.getItem("accessToken")
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    localStorage.setItem("accessToken", data.accessToken)
    return data.accessToken
  } catch (error) {
    return null
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = await getAccessToken()

  const makeRequest = async (authToken: string | null) => {
    const headers = new Headers(options.headers)
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`)
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  let response = await makeRequest(token)

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    token = await refreshAccessToken()
    if (token) {
      response = await makeRequest(token)
    }
  }

  return response
}
