import { NextRequest, NextResponse } from "next/server";
import { getActiveToken, getNextDuePost, markPostFailed, markPostPublished } from "@/lib/db";
import { InstagramApiError, publishPost } from "@/lib/instagram";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  return !!secret && auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
  }

  const post = await getNextDuePost();
  if (!post) {
    return NextResponse.json({ message: "Nessun post in coda da pubblicare" });
  }

  const token = await getActiveToken();
  if (!token) {
    await markPostFailed(post.id, "Nessun token Instagram configurato in ig_tokens");
    return NextResponse.json(
      { message: "Nessun token Instagram configurato" },
      { status: 500 }
    );
  }

  try {
    const { mediaId, permalink } = await publishPost({
      igUserId: token.ig_user_id,
      accessToken: token.access_token,
      caption: post.caption,
      imageUrls: post.image_urls,
    });

    await markPostPublished(post.id, mediaId, permalink);

    return NextResponse.json({ message: "Pubblicato", postId: post.id, mediaId, permalink });
  } catch (error) {
    const message = error instanceof InstagramApiError ? error.message : String(error);
    await markPostFailed(post.id, message);
    return NextResponse.json(
      { message: "Pubblicazione fallita", postId: post.id, error: message },
      { status: 500 }
    );
  }
}
