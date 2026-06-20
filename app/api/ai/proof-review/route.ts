import { NextResponse } from "next/server";

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface ProofReviewResponse {
  status:
    | "Proof looks valid"
    | "Proof may be incomplete"
    | "Proof mismatch detected";
  score: number;
  verdict: "Looks valid" | "Needs manual review";
  issues: string[];
  summary: string;
  reasons: string[];
}

const groqChatUrl = "https://api.groq.com/openai/v1/chat/completions";

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedMatch?.[1] ?? trimmed;
  return JSON.parse(jsonText) as Partial<ProofReviewResponse>;
}

function normalizeReview(
  review: Partial<ProofReviewResponse>,
): ProofReviewResponse {
  const score = Math.min(
    100,
    Math.max(0, Math.round(Number(review.score) || 0)),
  );
  const status =
    review.status === "Proof looks valid" ||
    review.status === "Proof may be incomplete" ||
    review.status === "Proof mismatch detected"
      ? review.status
      : score >= 75
        ? "Proof looks valid"
        : score >= 45
          ? "Proof may be incomplete"
          : "Proof mismatch detected";

  return {
    status,
    score,
    verdict:
      review.verdict === "Looks valid" ? "Looks valid" : "Needs manual review",
    issues: Array.isArray(review.issues) ? review.issues.slice(0, 5) : [],
    summary:
      typeof review.summary === "string" && review.summary.trim()
        ? review.summary.trim()
        : "AI reviewed the uploaded proof for relevance to the deal.",
    reasons: Array.isArray(review.reasons)
      ? review.reasons.slice(0, 5)
      : ["Groq reviewed proof metadata against the deal requirements."],
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: {
    dealTitle?: string;
    dealDescription?: string;
    deliverableType?: string;
    proofTitle?: string;
    proofNote?: string;
    fileName?: string;
    previewUrl?: string;
    proofCid?: string;
    proofUrl?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid proof review request.",
        details: "The AI proof review endpoint expects a JSON body.",
      },
      { status: 400 },
    );
  }

  let response: Response;
  try {
    response = await fetch(groqChatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are SealPay's AI proof reviewer. Return only valid JSON with keys: status, score, verdict, issues, summary, reasons. status must be one of: Proof looks valid, Proof may be incomplete, Proof mismatch detected. score must be 0-100. verdict must be Looks valid or Needs manual review. Do not approve payment; only advise human review.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Review whether the freelancer proof appears relevant to the deal.",
              deal: {
                title: body.dealTitle,
                description: body.dealDescription,
                deliverableType: body.deliverableType,
              },
              proof: {
                title: body.proofTitle,
                note: body.proofNote,
                fileName: body.fileName,
                previewUrl: body.previewUrl,
                cid: body.proofCid,
                gatewayUrl: body.proofUrl,
              },
            }),
          },
        ],
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Groq proof review request failed.",
        details:
          error instanceof Error
            ? error.message
            : "The Groq API could not be reached.",
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      { error: "Groq proof review failed.", details },
      { status: response.status },
    );
  }

  const result = (await response.json()) as GroqChatResponse;
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "Groq returned an empty proof review." },
      { status: 502 },
    );
  }

  try {
    return NextResponse.json(normalizeReview(parseJsonObject(content)));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Groq returned invalid proof review JSON.",
        details:
          error instanceof Error
            ? error.message
            : "The response could not be parsed.",
      },
      { status: 502 },
    );
  }
}
