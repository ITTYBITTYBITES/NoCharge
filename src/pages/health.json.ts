import type { APIRoute } from 'astro';

export const prerender = true;

// This module is evaluated while the static site is built, so the endpoint
// contains release metadata without contacting a runtime service.
const builtAt = new Date().toISOString();
const release = import.meta.env.PUBLIC_RELEASE ?? '1.0.0';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        status: 'ok',
        site: 'NoCharge',
        release,
        builtAt,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
