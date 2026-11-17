"use client";

import { useCallback, useRef, useState } from "react";
import type { ApiErrorBody } from "@/lib/contracts";

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public requestId = "", public retryable = false) { super(message); }
}

export async function readApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET", signal, cache: "no-store" });
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { credentials: "same-origin", ...options }); }
  catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiFailure(0, "NETWORK_ERROR", "Não foi possível confirmar a operação. Confira sua conexão e tente novamente; o mesmo envio não será duplicado.", "", true);
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    throw new ApiFailure(response.status, body?.error?.code || "REQUEST_FAILED", body?.error?.message || "Não foi possível concluir a operação. Tente novamente.", body?.error?.requestId, body?.error?.retryable);
  }
  return data as T;
}

/** Retains the operation key after an uncertain failure, including explicit retries. */
export function useApiAction() {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const attempts = useRef(new Map<string, string>());
  const mutate = useCallback(async <T,>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body: unknown): Promise<T> => {
    if (busy.current) throw new ApiFailure(409, "CLIENT_BUSY", "Aguarde a operação em andamento.");
    const payload = JSON.stringify(body);
    const fingerprint = `${method}:${path}:${payload}`;
    const key = attempts.current.get(fingerprint) || crypto.randomUUID();
    attempts.current.set(fingerprint, key);
    busy.current = true; setPending(true);
    try {
      const result = await request<T>(path, { method, body: payload, headers: { "Content-Type": "application/json", "X-Nexo-Request": "1", "Idempotency-Key": key } });
      attempts.current.delete(fingerprint);
      return result;
    } catch (error) {
      if (error instanceof ApiFailure && error.status === 409) attempts.current.delete(fingerprint);
      throw error;
    } finally { busy.current = false; setPending(false); }
  }, []);
  return { mutate, pending };
}

export function failureText(error: unknown) { return error instanceof Error ? error.message : "Não foi possível concluir a operação."; }
export function signInHref(returnTo: string) { return `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/")}`; }
export function dateLabel(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "Data indisponível" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }); }
export function moneyUsd(microusd: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 6 }).format(microusd / 1_000_000); }
