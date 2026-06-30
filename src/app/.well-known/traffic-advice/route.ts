/**
 * Generates the traffic-advice JSON for Chrome's Prefetch Proxy.
 * This tells Chrome it is allowed to prefetch pages to improve speed.
 */
export async function GET() {
  const data = [
    {
      user_agent: "prefetch-proxy",
      fraction: 1.0
    }
  ];

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/trafficadvice+json',
    },
  });
}