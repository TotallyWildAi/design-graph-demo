import { redirect } from "next/navigation";

// The app moved to the root path; old /design-graph links keep working.
export default function DesignGraphPage() {
  redirect("/");
}
