// Setup:
// 1. Go to https://resend.com > API Keys > Create API Key (name: "KoreShield Blog", Full Access)
// 2. Copy the API key (starts with re_) — you only see it once
// 3. Get your Audience ID:
//    - Go to https://resend.com/audience
//    - Click the </> button (top right of the page)
//    - Scroll the code panel until you see a UUID like 5e4d5e4d-5e4d-5e4d-... — that is your Audience ID
//    - OR call: curl -H "Authorization: Bearer YOUR_API_KEY" https://api.resend.com/audiences
// 4. In Cloudflare Pages dashboard > your project > Settings > Environment Variables:
//    Add RESEND_API_KEY = re_your_key_here
//    Add RESEND_AUDIENCE_ID = eaaab766-c52e-41f6-9ce2-ce42f7dfb290  (Blog audience)
// 5. For local dev: add both values to koreshield-blog/.env (never commit real values)

interface Env {
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
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
    const body = await request.json() as { email?: string };
    const email = body?.email?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Use explicit audience ID — falls back to auto-detect if not set
    let audienceId = env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      const audiencesRes = await fetch("https://api.resend.com/audiences", {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      });
      if (audiencesRes.ok) {
        const audiencesData = await audiencesRes.json() as { data?: { id: string }[] };
        audienceId = audiencesData?.data?.[0]?.id ?? "";
      }
    }

    if (!audienceId) {
      throw new Error("No audience found. Set RESEND_AUDIENCE_ID in your environment variables.");
    }

    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        // source: "blog" tags this contact so the "Blog" segment filter picks them up
        body: JSON.stringify({ email, unsubscribed: false, data: { source: "blog" } }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(data?.message || "Resend API error.");
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