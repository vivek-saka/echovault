import { auth }    from "@/lib/auth";
import { WorkspaceOverview } from "@/components/collaboration/workspace-overview";

export default async function WorkspacePage() {
  const session = await auth();

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <WorkspaceOverview userId={session!.user.id} />
    </div>
  );
}
