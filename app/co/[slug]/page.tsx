import { notFound } from "next/navigation";
import BackButton from "@/components/demo/BackButton";
import ApplicationForm from "@/components/company/ApplicationForm";
import ApplicationRow from "@/components/company/ApplicationRow";
import MessageButton from "@/components/company/MessageButton";
import CopyCompanyLink from "@/components/company/CopyCompanyLink";
import CompanyEditor from "@/components/company/CompanyEditor";
import { contactHref, CONTACT_TYPES } from "@/lib/companyContacts";
import CatalogManager from "@/components/company/CatalogManager";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, getCompanyPosts, getCompanyApplications } from "@/lib/companies";
import { getCompanyCatalog } from "@/lib/catalog";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ add?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { add, category } = await searchParams;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [user, posts, applications, catalogItems] = await Promise.all([
    getCurrentUser(),
    getCompanyPosts(company.id),
    company.isOwnerOrAdmin ? getCompanyApplications(company.id) : Promise.resolve([]),
    getCompanyCatalog(company.id),
  ]);

  const isOwnProfile = user?.id === company.ownerId;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="rounded-lg border border-neutral-200 dark:border-line p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-paper">{company.name}</h1>
            {company.industry && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{company.industry}</p>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400 underline">
                {company.website}
              </a>
            )}
            {company.bin && <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">БИН {company.bin}</p>}
          </div>

          <div className="flex gap-2">
            {!isOwnProfile && (
              <MessageButton otherUserId={company.ownerId} draft={`Здравствуйте! Пишу из SAPNUM по поводу компании «${company.name}»`} />
            )}
            {company.isOwnerOrAdmin && (
              <CompanyEditor
                slug={slug}
                initial={{
                  name: company.name,
                  industry: company.industry,
                  description: company.description,
                  website: company.website,
                  bin: company.bin,
                  contacts: company.contacts,
                }}
              />
            )}
            <CopyCompanyLink slug={slug} />
          </div>
        </div>

        {company.description && <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{company.description}</p>}

        {company.contacts.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {company.contacts.map((c, i) => {
              const href = contactHref(c);
              const label = CONTACT_TYPES.find((t) => t.value === c.type)?.label ?? "";
              const chip = "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-line px-3 py-1 text-xs";
              return (
                <li key={i}>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${chip} text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute`}>
                      <span className="text-neutral-400 dark:text-neutral-500">{label}</span>
                      {c.value}
                    </a>
                  ) : (
                    <span className={`${chip} text-neutral-700 dark:text-neutral-300`}>
                      <span className="text-neutral-400 dark:text-neutral-500">{label}</span>
                      {c.value}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!isOwnProfile && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">Подать заявку</h2>
          <ApplicationForm
            companyId={company.id}
            allowInvestment={user?.roles.includes("investor") ?? false}
            defaultMessage={`Здравствуйте! Пишу из SAPNUM. `}
          />
        </div>
      )}

      {company.isOwnerOrAdmin && applications.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">Входящие заявки</h2>
          <div className="space-y-2">
            {applications.map((a) => (
              <ApplicationRow key={a.id} application={a} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">Каталог</h2>
        <CatalogManager
          companyId={company.id}
          items={catalogItems}
          canManage={company.isOwnerOrAdmin}
          autoOpen={add === "1" && company.isOwnerOrAdmin}
          initialCategory={category ?? null}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">Записи компании</h2>
        {posts.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">Пока нет записей.</p>}
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="rounded-lg border border-neutral-200 dark:border-line p-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <span className="font-medium text-neutral-900 dark:text-paper">{p.author}</span>
                <span>{p.time}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{p.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
