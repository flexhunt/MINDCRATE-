import { createClient } from "@libsql/client"

let client: ReturnType<typeof createClient> | null = null;

export function getTurso() {
    if (!client) {
        if (!process.env.TURSO_DATABASE_URL) {
            console.warn("TURSO_DATABASE_URL is missing. Turso queries will fail.");
        }
        client = createClient({
            url: process.env.TURSO_DATABASE_URL || "libsql://dummy",
            authToken: process.env.TURSO_AUTH_TOKEN || "",
        });
    }
    return client;
}
