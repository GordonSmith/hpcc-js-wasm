import { PKG_VERSION } from "./__package__.ts";

/**
 * Response from a prompt request.
 */
export interface PromptResponse {
    /** The formatted/processed message. */
    message: string;
    /** Optional model identifier. */
    model?: string;
    /** Optional system prompt. */
    systemPrompt?: string;
}

/**
 * Options for {@link CopilotClient.requestCompletion} and
 * {@link CopilotSdk.requestCompletion}.
 */
export interface CompletionOptions {
    /** The prompt to send to Copilot. */
    prompt: string;
    /** Model identifier to use for this request (overrides client default). */
    model?: string;
    /** System prompt to guide the assistant's behaviour. */
    systemPrompt?: string;
    /**
     * Hint for maximum response tokens.
     * Note: The Copilot CLI controls actual limits; this value is informational.
     */
    max_tokens?: number;
    /**
     * Sampling temperature (0.0 = deterministic, 1.0 = creative).
     * Note: The Copilot CLI controls actual sampling; this value is informational.
     */
    temperature?: number;
}

/**
 * Response returned by {@link CopilotClient.requestCompletion} and
 * {@link CopilotSdk.requestCompletion}.
 */
export interface CompletionResponse {
    /** The generated text from Copilot. */
    text: string;
}

/**
 * Configuration options for {@link CopilotClient}.
 */
export interface CopilotClientOptions {
    /**
     * GitHub token used for Copilot authentication.
     * Passed to the Copilot CLI as the `GITHUB_TOKEN` environment variable.
     */
    token?: string;
    /** Alias for {@link token} — matches common SDK naming conventions. */
    apiKey?: string;
    /** Default model to use for completions. */
    model?: string;
    /** Path to the Copilot CLI executable (uses bundled CLI if omitted). */
    cliPath?: string;
}

/**
 * High-level client for requesting completions from GitHub Copilot.
 *
 * Wraps the `@github/copilot-sdk` JSON-RPC client with a simple
 * `requestCompletion` interface.  The `@github/copilot-sdk` package must be
 * installed as a peer dependency (Node.js only).
 *
 * For embedding in **Java or C++** applications use the WASM Component
 * distributed alongside this package as `dist/copilot-sdklib.wasm`.  That
 * component makes direct HTTPS calls to the GitHub Copilot API via
 * `wasi:http/outgoing-handler` — no CLI process is required.
 *
 * ```ts
 * import { CopilotClient } from "@hpcc-js/wasm-copilot-sdk";
 *
 * const client = new CopilotClient({ token: process.env.GITHUB_TOKEN });
 *
 * const response = await client.requestCompletion({
 *   prompt: "Write a JavaScript function that reverses a string.",
 *   max_tokens: 150,
 * });
 * console.log(response.text);
 * ```
 */
export class CopilotClient {

    private _options: CopilotClientOptions;

    constructor(options: CopilotClientOptions = {}) {
        this._options = options;
    }

    /**
     * Send a prompt to GitHub Copilot and return the completion text.
     *
     * @param options - Completion request options.
     * @returns A promise resolving to the completion response.
     * @throws Error if `@github/copilot-sdk` is not installed.
     */
    async requestCompletion(options: CompletionOptions): Promise<CompletionResponse> {
        let sdkModule: typeof import("@github/copilot-sdk");
        try {
            sdkModule = await import("@github/copilot-sdk");
        } catch {
            throw new Error(
                "requestCompletion requires @github/copilot-sdk to be installed. " +
                "Run: npm install @github/copilot-sdk"
            );
        }

        const { CopilotClient: SdkClient, approveAll } = sdkModule;

        const token = this._options.token ?? this._options.apiKey;
        const clientOptions: ConstructorParameters<typeof SdkClient>[0] = {};
        if (this._options.cliPath) {
            clientOptions.cliPath = this._options.cliPath;
        }
        if (token) {
            clientOptions.env = { GITHUB_TOKEN: token };
        }

        const sdkClient = new SdkClient(clientOptions);
        try {
            const sessionConfig: Parameters<typeof sdkClient.createSession>[0] = {
                onPermissionRequest: approveAll,
            };
            const model = options.model ?? this._options.model;
            if (model) {
                sessionConfig.model = model;
            }
            if (options.systemPrompt) {
                sessionConfig.systemMessage = { mode: "replace", content: options.systemPrompt };
            }

            const session = await sdkClient.createSession(sessionConfig);
            try {
                const response = await session.sendAndWait({ prompt: options.prompt });
                return { text: response?.data.content ?? "" };
            } finally {
                await session.disconnect();
            }
        } finally {
            await sdkClient.stop();
        }
    }
}

let g_copilotSdk: Promise<CopilotSdk> | undefined;

/**
 * Lightweight Node.js API wrapper for GitHub Copilot.
 *
 * This class follows the singleton-load/unload pattern used by the other
 * `@hpcc-js/wasm-*` packages and does **not** require the WASM component at
 * runtime.  Completions are delegated to {@link CopilotClient} (which spawns
 * the Copilot CLI via `@github/copilot-sdk`).
 *
 * For embedding in **Java or C++** use the WASM Component distributed at
 * `dist/copilot-sdklib.wasm` — it is a self-contained WASI-preview-2
 * component that calls the Copilot API directly over HTTPS without requiring
 * a CLI process.
 *
 * ```ts
 * import { CopilotSdk } from "@hpcc-js/wasm-copilot-sdk";
 *
 * const sdk = await CopilotSdk.load();
 * console.log(sdk.version()); // "1.0.0"
 *
 * const response = await sdk.requestCompletion({
 *   prompt: "Write a JavaScript function that reverses a string.",
 *   // token is optional when @github/copilot-sdk handles auth via gh CLI
 * });
 * console.log(response.text);
 * ```
 */
export class CopilotSdk {

    private constructor() { }

    /**
     * Obtain the CopilotSdk singleton.
     *
     * Subsequent calls return the same instance until {@link unload} is called.
     *
     * @returns A promise resolving to the CopilotSdk instance.
     */
    static load(): Promise<CopilotSdk> {
        if (!g_copilotSdk) {
            g_copilotSdk = Promise.resolve(new CopilotSdk());
        }
        return g_copilotSdk;
    }

    /**
     * Release the singleton, allowing a fresh instance on the next {@link load}.
     */
    static async unload(): Promise<void> {
        g_copilotSdk = undefined;
    }

    /**
     * Return the package version string.
     */
    version(): string {
        return PKG_VERSION;
    }

    /**
     * Send a completion request to GitHub Copilot.
     *
     * Internally delegates to {@link CopilotClient}, which requires
     * `@github/copilot-sdk` to be installed as an optional peer dependency.
     *
     * @param options - Completion request options (prompt, model, token, …).
     * @returns A promise resolving to the completion response.
     */
    async requestCompletion(options: CompletionOptions & { token?: string }): Promise<CompletionResponse> {
        const client = new CopilotClient({
            token: options.token,
            model: options.model,
        });
        return client.requestCompletion(options);
    }

    /**
     * Send a prompt message and return a formatted response object.
     *
     * This method does **not** make a real network call — it wraps the
     * message in a {@link PromptResponse} envelope.  Use
     * {@link requestCompletion} for real Copilot API calls.
     *
     * @param message - The prompt message.
     * @param options - Optional model and system prompt metadata.
     * @returns The prompt response envelope.
     */
    async prompt(message: string, options?: { model?: string; systemPrompt?: string }): Promise<PromptResponse> {
        return {
            message,
            model: options?.model,
            systemPrompt: options?.systemPrompt,
        };
    }

    /**
     * Wrap a raw response string in a parsed-response envelope.
     *
     * @param raw - The raw response to wrap.
     * @returns `{ message: raw }`.
     */
    async parse(raw: string): Promise<{ message: string }> {
        return { message: raw };
    }
}
