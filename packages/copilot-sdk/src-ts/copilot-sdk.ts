/**
 * Copilot SDK — WASM Component source.
 *
 * Compiled to a WASM Component via `@bytecodealliance/componentize-js`.
 * The component runs inside any WASI-preview-2 capable runtime (wasmtime,
 * wasm-micro-runtime, etc.) and is designed for embedding in Java and C++
 * applications.
 *
 * Networking is provided by the WASI `wasi:http/outgoing-handler` import,
 * surfaced as the standard `fetch()` global by componentize-js.  The host
 * must grant outbound-HTTP capability to `https://api.githubcopilot.com`.
 *
 * Filesystem access (session storage) can be added later via the WASI
 * `wasi:filesystem` interfaces without changing the public `handle` API.
 *
 * ---
 * WIT export: `handle: func(request: string) -> string`
 * ---
 */

const COPILOT_API_URL = "https://api.githubcopilot.com/chat/completions";

// --- Request / Response types ---

interface CompletionRequest {
    action: "completion";
    prompt: string;
    /** GitHub OAuth token with Copilot access. */
    token: string;
    options?: {
        model?: string;
        systemPrompt?: string;
        max_tokens?: number;
        temperature?: number;
    };
}

interface ParseRequest {
    action: "parse";
    raw: string;
}

type Request = CompletionRequest | ParseRequest;

interface CompletionResult {
    type: "completion_response";
    text: string;
}

interface ParseResult {
    type: "parsed_response";
    message: string;
}

interface ErrorResult {
    type: "error";
    message: string;
}

type Result = CompletionResult | ParseResult | ErrorResult;

// --- Copilot API ---

async function callCopilotApi(req: CompletionRequest): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (req.options?.systemPrompt) {
        messages.push({ role: "system", content: req.options.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    const body: Record<string, unknown> = {
        model: req.options?.model ?? "gpt-4o",
        messages,
    };
    if (req.options?.max_tokens !== undefined) {
        body.max_tokens = req.options.max_tokens;
    }
    if (req.options?.temperature !== undefined) {
        body.temperature = req.options.temperature;
    }

    const response = await fetch(COPILOT_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${req.token}`,
            "Content-Type": "application/json",
            "Editor-Version": "hpcc-js-wasm/1.0",
            "User-Agent": "@hpcc-js/wasm-copilot-sdk",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => String(response.status));
        throw new Error(`Copilot API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
    };

    return data.choices[0]?.message?.content ?? "";
}

// --- Main exported function (maps to WIT `handle`) ---

/**
 * Process a JSON-encoded request and return a JSON-encoded response.
 *
 * This function is exported as the `handle` WIT function and is the
 * primary entry-point for Java/C++ embedders.
 */
export async function handle(requestJson: string): Promise<string> {
    let result: Result;
    try {
        const request = JSON.parse(requestJson) as Request;
        switch (request.action) {
            case "completion": {
                const text = await callCopilotApi(request);
                result = { type: "completion_response", text };
                break;
            }
            case "parse": {
                result = { type: "parsed_response", message: request.raw };
                break;
            }
            default: {
                result = {
                    type: "error",
                    message: `Unknown action: ${(request as Record<string, unknown>).action}`,
                };
            }
        }
    } catch (e) {
        result = {
            type: "error",
            message: e instanceof Error ? e.message : String(e),
        };
    }
    return JSON.stringify(result);
}
