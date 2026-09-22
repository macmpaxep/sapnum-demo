import { notFound } from "next/navigation";
import ApplicationForm from "@/components/company/ApplicationForm";
import ApplicationRow from "@/components/company/ApplicationRow";
import MessageButton from "@/components/company/MessageButton";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, getCompanyPosts, getCompanyApplications } from "@/lib/companies";

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [user, posts, applications] = await Promise.all([
    getCurrentUser(),
    getCompanyPosts(company.id),
    company.isOwnerOrAdmin ? getCompanyApplications(company.id) : Promise.resolve([]),
  ]);

  const isOwnProfile = user?.id === company.ownerId;

  return (
    <div className="space-y-6">
      <div className="border border-neutral-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{company.name}</h1>
            {company.industry && <p className="mt-1 text-sm text-neutral-500">{company.industry}</p>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-neutral-500 underline">
                {company.website}
              </a>
            )}
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2">
              <MessageButton otherUserId={company.ownerId} />
            </div>
          )}
        </div>

        {company.description && <p className="mt-4 text-sm leading-relaxed text-neutral-700">{company.description}</p>}
      </div>

      {!isOwnProfile && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-900">Подать заявку</h2>
          <ApplicationForm companyId={company.id} allowInvestment={user?.roles.includes("investor") ?? false} />
        </div>
      )}

      {company.isOwnerOrAdmin && applications.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-900">Входящие заявки</h2>
          <div className="space-y-2">
            {applications.map((a) => (
              <ApplicationRow key={a.id} application={a} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900">Записи компании</h2>
        {posts.length === 0 && <p className="text-sm text-neutral-500">Пока нет записей.</p>}
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-neutral-900">{p.author}</span>
                <span>{p.time}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{p.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
