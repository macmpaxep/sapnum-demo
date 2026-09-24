import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/profiles";

// Lightweight public-profile lookup used by the hover card on actor
// names in the activity feed — reuses the same data as /u/[username].
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  return NextResponse.json({
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    roles: profile.roles,
    followerCount: profile.followerCount,
  });
}
