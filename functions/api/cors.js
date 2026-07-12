const ALLOWED_HOSTS = new Set([
    "arduboy.com",
    "www.arduboy.com",
    "arduboy.ried.cl",
    "crait.net",
    "www.crait.net",
    "raw.githubusercontent.com",
    "github.com",
    "bitbucket.org",
    "framagit.org"
]);

function corsHeaders(contentType) {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=300",
        ...(contentType ? { "Content-Type": contentType } : {})
    };
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet({ request }) {
    const target = new URL(request.url).searchParams.get("url");
    if (!target) {
        return new Response("Missing url parameter", { status: 400, headers: corsHeaders("text/plain; charset=utf-8") });
    }

    let targetURL;
    try {
        targetURL = new URL(target);
    } catch (_) {
        return new Response("Invalid url parameter", { status: 400, headers: corsHeaders("text/plain; charset=utf-8") });
    }

    if (!["http:", "https:"].includes(targetURL.protocol) || !ALLOWED_HOSTS.has(targetURL.hostname.toLowerCase())) {
        return new Response("Target host is not allowed", { status: 403, headers: corsHeaders("text/plain; charset=utf-8") });
    }

    try {
        const response = await fetch(targetURL.toString(), {
            headers: { Accept: request.headers.get("Accept") || "*/*" },
            redirect: "follow"
        });
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: corsHeaders(response.headers.get("content-type"))
        });
    } catch (_) {
        return new Response("Proxy request failed", { status: 502, headers: corsHeaders("text/plain; charset=utf-8") });
    }
}
