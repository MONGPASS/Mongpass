import specification from "../../../../docs/openapi.json";

export const runtime = "edge";

export async function GET(): Promise<Response> {
  return Response.json(specification, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
