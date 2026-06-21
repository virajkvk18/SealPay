import { NextResponse } from "next/server";
import {
  getUploadLimitBytes,
  isValidDealId,
  logApiSecurityEvent,
  providerErrorDetails,
  rejectUntrustedOrigin,
} from "@/lib/serverSecurity";

interface PinataResponse {
  IpfsHash: string;
}

const pinataUploadUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function getGatewayUrl(cid: string) {
  const gateway =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

  return `${gateway.replace(/\/$/, "")}/${cid}`;
}

export async function POST(request: Request) {
  const originRejected = rejectUntrustedOrigin(request);
  if (originRejected) return originRejected;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid upload request.",
        details: "The proof upload must be sent as multipart form data.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const dealId = formData.get("dealId");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Proof file is required." },
      { status: 400 },
    );
  }

  const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

if (!allowedTypes.includes(file.type)) {
  return NextResponse.json(
    { error: "Only PDF, PNG and JPG files are allowed." },
    { status: 400 },
  );
}

  if (!isValidDealId(dealId)) {
    logApiSecurityEvent("invalid_upload_deal_id", request);
    return NextResponse.json(
      { error: "A valid deal ID is required." },
      { status: 400 },
    );
  }

  const uploadLimitBytes = getUploadLimitBytes();
  if (file.size <= 0 || file.size > uploadLimitBytes) {
    logApiSecurityEvent("proof_upload_size_blocked", request, {
      dealId,
      fileSize: file.size,
      uploadLimitBytes,
    });
    return NextResponse.json(
      { error: "Proof file size is not allowed." },
      { status: 413 },
    );
  }

  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    return NextResponse.json(
      {
        error: "PINATA_JWT is not configured on the server.",
        details:
          "Add a real Pinata JWT to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const uploadData = new FormData();
  uploadData.append("file", file, file.name);

  let response: Response;
  try {
    response = await fetch(pinataUploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: uploadData,
    });
  } catch (error) {
    logApiSecurityEvent("pinata_request_error", request, { dealId });
    return NextResponse.json(
      {
        error: "Pinata upload request failed.",
        details:
          error instanceof Error
            ? error.message
            : "The Pinata API could not be reached.",
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const details = await response.text();
    logApiSecurityEvent("pinata_provider_error", request, {
      dealId,
      status: response.status,
    });
    return NextResponse.json(
      { error: "Pinata upload failed.", details: providerErrorDetails(details) },
      { status: response.status },
    );
  }

  const result = (await response.json()) as Partial<PinataResponse>;

  if (!result.IpfsHash) {
    return NextResponse.json(
      {
        error: "Pinata upload response was missing a CID.",
        details: "Pinata did not return IpfsHash for the uploaded proof file.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    cid: result.IpfsHash,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
    fileName: file.name,
  });
}
