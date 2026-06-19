import { NextResponse } from "next/server";

interface PinataResponse {
  IpfsHash: string;
}

const pinataUploadUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function getGatewayUrl(cid: string) {
  const gateway =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

  return `${gateway.replace(/\/$/, "")}/${cid}`;
}

function createMockCid(fileName: string) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const suffix = Array.from({ length: 18 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

  return `bafyseal${safeName || "proof"}${suffix}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Proof file is required." }, { status: 400 });
  }

  const pinataJwt = process.env.PINATA_JWT;
  const mockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE !== "false";

  if (!pinataJwt && mockMode) {
    const cid = createMockCid(file.name);

    return NextResponse.json({
      cid,
      gatewayUrl: getGatewayUrl(cid),
      fileName: file.name,
    });
  }

  if (!pinataJwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured on the server." },
      { status: 500 },
    );
  }

  const uploadData = new FormData();
  uploadData.append("file", file, file.name);

  const response = await fetch(pinataUploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: uploadData,
  });

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      { error: "Pinata upload failed.", details },
      { status: response.status },
    );
  }

  const result = (await response.json()) as PinataResponse;

  return NextResponse.json({
    cid: result.IpfsHash,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
    fileName: file.name,
  });
}
