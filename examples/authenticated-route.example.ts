import { NextRequest, NextResponse } from "next/server";

/**
 * ポートフォリオ用に単純化した例です。
 * 実装ではセッション検証済みの利用者IDだけを認可に使用します。
 */
type AuthenticatedUser = {
  id: string;
};

async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedUser> {
  // Supabase Authのアクセストークンまたは署名済みCookieを
  // サーバー側で検証する処理に置き換えます。
  const session = request.cookies.get("app_session")?.value;

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { id: "verified-user-id" };
}

async function readOwnedResource(userId: string) {
  // クライアントから渡されたuserIdではなく、
  // 検証済みセッションのuserIdで所有データを絞り込みます。
  return { ownerId: userId, status: "ready" };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const resource = await readOwnedResource(user.id);

    return NextResponse.json(resource, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Response) return error;

    return NextResponse.json(
      { error: "データを取得できませんでした。" },
      { status: 503 },
    );
  }
}
