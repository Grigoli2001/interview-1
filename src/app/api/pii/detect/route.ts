import { NextResponse } from "next/server";
import { detectPii } from "@/lib/pii/detect";
import { piiDetectRequestSchema } from "@/lib/pii/types";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = piiDetectRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.flatten().fieldErrors.text?.[0] ?? parsed.error.message;
      logger.warn("PII detect validation failed", { error: firstError });
      return NextResponse.json(
        { error: firstError ?? "Invalid request" },
        { status: 400 },
      );
    }

    const spans = await detectPii(parsed.data.text);
    return NextResponse.json({ spans });
  } catch (error) {
    logger.error("PII detect request failed", { error });
    return NextResponse.json(
      { error: "Failed to detect PII" },
      { status: 500 },
    );
  }
}
