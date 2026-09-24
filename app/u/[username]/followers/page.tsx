import { notFound } from "next/navigation";
import Link from "next/link";
import PersonRow from "@/components/people/PersonRow";
import { getPublicProfile, listFollowers } from "@/lib/profiles";

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const followers = await listFollowers(profile.id);

  return (
    <div>
      <Link href={`/u/${username}`} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
        ← {profile.displayName}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Подписчики</h1>

      {followers.length === 0 && <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Пока никто не подписан.</p>}

      <div className="mt-4 divide-y divide-neutral-100 border border-neutral-200 dark:border-neutral-800">
        {followers.map((p) => (
          <PersonRow key={p.id} person={p} />
        ))}
      </div>
    </div>
  );
}
