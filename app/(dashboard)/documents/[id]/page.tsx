import { notFound } from "next/navigation";
import { auth }      from "@/lib/auth";
import { db }        from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and }   from "drizzle-orm";
import { DocumentEditor } from "@/components/editor/document-editor";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) notFound();

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, id),
      eq(documents.isArchived, false)
    ),
    with: {
      author:    { columns: { id: true, name: true, image: true } },
      workspace: { columns: { id: true, name: true } },
    },
  });

  if (!doc) notFound();

  return (
    <DocumentEditor
      document={doc}
      currentUserId={session.user.id}
    />
  );
}

export async function generateMetadata({ params }: DocumentPageProps) {
  const { id } = await params;
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    columns: { title: true, emoji: true },
  });

  return {
    title: doc ? `${doc.emoji} ${doc.title}` : "Document",
  };
}
