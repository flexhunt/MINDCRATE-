export async function GET() {
  return new Response("Sitemap test working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
