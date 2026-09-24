import ProfileSidebar, { type ProfileMenuItem } from "./ProfileSidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCompanySlugForUser } from "@/lib/companies";

// Resolves the "Компания" link per the logged-in user (their own company,
// or the onboarding form if they haven't created one yet) before handing
// off to the client-rendered sidebar for active-link highlighting.
export default async function ProfileSidebarData() {
  const user = await getCurrentUser();
  const companySlug = user ? await getCompanySlugForUser(user.id) : null;

  const items: ProfileMenuItem[] = [
    { label: "Записи", href: user ? `/u/${user.username}` : "/login" },
    { label: "Компания", href: companySlug ? `/co/${companySlug}` : "/co/new" },
    { label: "Заявки", href: "/applications" },
    { label: "Активность", href: "/activity" },
    { label: "Сохранённое", href: "/saved" },
  ];

  return <ProfileSidebar items={items} />;
}
