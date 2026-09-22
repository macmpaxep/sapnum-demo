import { notFound } from "next/navigation";
import Link from "next/link";
import PersonRow from "@/components/people/PersonRow";
import { getPublicProfile, listFollowing } from "@/lib/profiles";

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const following = await listFollowing(profile.id);

  return (
    <div>
      <Link href={`/u/${username}`} className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {profile.displayName}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-neutral-900">Подписки</h1>

      {following.length === 0 && <p className="mt-6 text-sm text-neutral-500">Пока ни на кого не подписан(а).</p>}

      <div className="mt-4 divide-y divide-neutral-100 border border-neutral-200">
        {following.map((p) => (
          <PersonRow key={p.id} person={p} />
        ))}
      </div>
    </div>
  );
}
