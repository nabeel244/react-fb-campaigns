export async function GET() {
  console.log('✅ Test route is working!');
  return new Response(JSON.stringify({ message: "Google API routing works!" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

