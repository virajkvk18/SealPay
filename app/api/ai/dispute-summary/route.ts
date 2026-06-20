import { NextResponse } from "next/server";
import {
  logApiSecurityEvent,
  providerErrorDetails,
  rejectOversizedBody,
  rejectUntrustedOrigin,
  truncateText,
} from "@/lib/serverSecurity";

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface DisputeSummaryResponse {
  title: "AI Dispute Summary";
  summary: string;
  recommendation: string;
}

const groqChatUrl = "https://api.groq.com/openai/v1/chat/completions";

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedMatch?.[1] ?? trimmed;
  return JSON.parse(jsonText) as Partial<DisputeSummaryResponse>;
}

function normalizeSummary(
  summary: Partial<DisputeSummaryResponse>,
): DisputeSummaryResponse {
  return {
    title: "AI Dispute Summary",
    summary:
      typeof summary.summary === "string" && summary.summary.trim()
        ? summary.summary.trim()
        : "A dispute was raised and should be reviewed by a human admin/judge.",
    recommendation:
      typeof summary.recommendation === "string" &&
      summary.recommendation.trim()
        ? summary.recommendation.trim()
        : "Compare deal requirements, submitted proof, and timeline before making a final decision.",
  };
}

export async function POST(request: Request) {
  const originRejected = rejectUntrustedOrigin(request);
  if (originRejected) return originRejected;

  const oversized = rejectOversizedBody(request);
  if (oversized) return oversized;

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
    clientName?: string;
    freelancerName?: string;
    reason?: string;
    evidence?: string;
    proofCid?: string;
    proofUrl?: string;
    timeline?: Array<{
      title: string;
      status: string;
      actor: string;
      timestamp: string;
    }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid dispute summary request.",
        details: "The AI dispute summary endpoint expects a JSON body.",
      },
      { status: 400 },
    );
  }

  const safeTimeline = Array.isArray(body.timeline)
    ? body.timeline.slice(0, 25).map((event) => ({
        title: truncateText(event.title, 160),
        status: truncateText(event.status, 80),
        actor: truncateText(event.actor, 80),
        timestamp: truncateText(event.timestamp, 80),
      }))
    : [];

  const safeBody = {
    dealTitle: truncateText(body.dealTitle, 160),
    dealDescription: truncateText(body.dealDescription, 2_000),
    clientName: truncateText(body.clientName, 160),
    freelancerName: truncateText(body.freelancerName, 160),
    reason: truncateText(body.reason, 2_000),
    evidence: truncateText(body.evidence, 2_000),
    proofCid: truncateText(body.proofCid, 160),
    proofUrl: truncateText(body.proofUrl, 500),
    timeline: safeTimeline,
  };

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
              "You are SealPay's dispute summarizer. Return only valid JSON with keys: title, summary, recommendation. title must be AI Dispute Summary. Do not make the final decision; recommend what a human admin/judge should compare.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Summarize this escrow dispute for an admin/judge.",
              deal: {
                title: safeBody.dealTitle,
                description: safeBody.dealDescription,
                clientName: safeBody.clientName,
                freelancerName: safeBody.freelancerName,
              },
              dispute: {
                reason: safeBody.reason,
                evidence: safeBody.evidence,
              },
              proof: {
                cid: safeBody.proofCid,
                gatewayUrl: safeBody.proofUrl,
              },
              timeline: safeBody.timeline,
            }),
          },
        ],
      }),
    });
  } catch (error) {
    logApiSecurityEvent("groq_dispute_summary_request_error", request);
    return NextResponse.json(
      {
        error: "Groq dispute summary request failed.",
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
    logApiSecurityEvent("groq_dispute_summary_provider_error", request, {
      status: response.status,
    });
    return NextResponse.json(
      {
        error: "Groq dispute summary failed.",
        details: providerErrorDetails(details),
      },
      { status: response.status },
    );
  }

  const result = (await response.json()) as GroqChatResponse;
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "Groq returned an empty dispute summary." },
      { status: 502 },
    );
  }

  try {
    return NextResponse.json(normalizeSummary(parseJsonObject(content)));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Groq returned invalid dispute summary JSON.",
        details:
          error instanceof Error
            ? error.message
            : "The response could not be parsed.",
      },
      { status: 502 },
    );
  }
}
