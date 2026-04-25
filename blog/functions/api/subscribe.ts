// Blog newsletter subscribe — powered by Plunk (free, no limits on contacts)
//
// Setup:
// 1. Go to https://useplunk.com > Settings > API Keys > copy your Secret key
// 2. In Cloudflare Pages dashboard > your project > Settings > Environment Variables:
//    Add PLUNK_API_KEY = sk_your_secret_key_here
// 3. For local dev: add the value to web/blog/.env (never commit real values)
//
// Plunk free plan: unlimited contacts, no monthly cap on events.

interface Env {
  PLUNK_API_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = await request.json() as { email?: string; name?: string };
    const email = body?.email?.trim();
    const firstName = body?.name?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!firstName) {
      return new Response(JSON.stringify({ error: "Please enter your first name." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Upsert contact in Plunk and tag them as a blog subscriber
    const res = await fetch("https://next-api.useplunk.com/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        subscribed: true,
        data: {
          name: firstName,
          source: "blog",
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(data?.message || "Failed to subscribe. Please try again.");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
};
