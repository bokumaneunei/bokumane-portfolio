import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

type OAuthState = {
  userId: string;
  nonce: string;
  expiresAt: number;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createOAuthState(
  userId: string,
  secret: string,
): string {
  const state: OAuthState = {
    userId,
    nonce: randomBytes(24).toString("base64url"),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const payload = encode(JSON.stringify(state));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOAuthState(
  value: string,
  expectedUserId: string,
  secret: string,
): boolean {
  const [payload, receivedSignature] = value.split(".");

  if (!payload || !receivedSignature) return false;

  const expectedSignature = sign(payload, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return false;
  }

  try {
    const state = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as OAuthState;

    return (
      state.userId === expectedUserId &&
      state.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}
