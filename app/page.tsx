import { EntryScreen } from "@/components/EntryScreen";
import { getHomePayload } from "@/lib/services/home";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { contexts, resume, totalActive, interruptCount } =
    await getHomePayload();
  return (
    <EntryScreen
      contexts={contexts}
      resume={resume}
      totalActive={totalActive}
      interruptCount={interruptCount}
    />
  );
}
