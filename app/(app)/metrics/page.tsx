import { redirect } from "next/navigation";

// "Показатели" is now inlined into the "Дашборд" tab instead of living
// on its own page — keep this route as a redirect so old links still work.
export default function MetricsPage() {
  redirect("/dashboard");
}
