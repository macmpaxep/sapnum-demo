import ProfileTabsHorizontal from "./ProfileTabsHorizontal";
import type { ProfileMenuItem } from "./ProfileSidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCompanySlugForUser } from "@/lib/companies";

export default async function ProfileTabsHorizontalData() {
  const user = await getCurrentUser();
  const companySlug = user ? await getCompanySlugForUser(user.id) : null;

  const items: ProfileMenuItem[] = [
    { label: "Записи", href: user ? `/u/${user.username}` : "/login" },
    { label: "Компания", href: companySlug ? `/co/${companySlug}` : "/co/new" },
    { label: "Заявки", href: "/applications" },
    { label: "Активность", href: "/activity" },
    { label: "Сохранённое", href: "/saved" },
  ];

  return <ProfileTabsHorizontal items={items} />;
}
