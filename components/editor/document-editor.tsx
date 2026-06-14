"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent }   from "@tiptap/react";
import StarterKit                     from "@tiptap/starter-kit";
import Placeholder                    from "@tiptap/extension-placeholder";
import Highlight                      from "@tiptap/extension-highlight";
import Typography                     from "@tiptap/extension-typography";
import TaskList                       from "@tiptap/extension-task-list";
import TaskItem                       from "@tiptap/extension-task-item";
import Link                           from "@tiptap/extension-link";
import Image                          from "@tiptap/extension-image";
import {
  Bold, Italic, Strikethrough, Code, Code2,
  List, ListOrdered, CheckSquare, Quote, Heading1,
  Heading2, Heading3, Undo, Redo, Link2, Image as ImageIcon,
  Save, History, Lock, Unlock, MoreHorizontal, Trash2,
} from "lucide-react";
import type { Document } from "@/lib/db/schema";
import { api }           from "@/lib/trpc/client";
import { useToast }      from "@/hooks/use-toast";
import { debounce }      from "@/lib/utils";
import { cn }            from "@/lib/utils";

interface DocumentEditorProps {
  document: Document & {
    author:    { id: string; name: string | null; image: string | null };
    workspace: { id: string; name: string };
  };
  currentUserId: string;
}

const AUTOSAVE_DELAY = 2000; // 2 seconds

export function DocumentEditor({ document: doc, currentUserId }: DocumentEditorProps) {
  const { toast } = useToast();
  const [title, setTitle]           = useState(doc.title);
  const [isSaving, setIsSaving]     = useState(false);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const [isEncrypted, setEncrypted] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const utils = api.useUtils();

  const updateMutation = api.documents.update.useMutation({
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
      utils.documents.list.invalidate();
    },
    onError: (e) => {
      setIsSaving(false);
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    },
  });

  const archiveMutation = api.documents.archive.useMutation({
    onSuccess: () => {
      toast({ title: "Document archived" });
      window.location.href = "/workspace";
    },
  });

  // Auto-save on content change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSave = useCallback(
    debounce((content: string) => {
      setIsSaving(true);
      updateMutation.mutate({ id: doc.id, content });
    }, AUTOSAVE_DELAY),
    [doc.id]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing, or press '/' for commands…",
      }),
      Highlight,
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick:      false,
        HTMLAttributes: { class: "text-vault-500 underline" },
      }),
      Image.configure({ inline: true }),
    ],
    content: doc.content ?? "",
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      autoSave(content);
    },
  });

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  function saveTitle() {
    if (title !== doc.title) {
      updateMutation.mutate({ id: doc.id, title });
    }
  }

  const isOwner = doc.authorId === currentUserId;

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-6 py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Formatting buttons */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              title="Inline code"
            >
              <Code className="w-3.5 h-3.5" />
            </ToolbarButton>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </ToolbarButton>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              title="Task list"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive("codeBlock")}
              title="Code block"
            >
              <Code2 className="w-3.5 h-3.5" />
            </ToolbarButton>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>

          {/* Status area */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-4">
            <div className="flex items-center gap-1.5">
              {isEncrypted ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Encrypted</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Unencrypted</span>
                </>
              )}
            </div>
            {isSaving ? (
              <span className="animate-pulse">Saving…</span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : null}
            {isOwner && (
              <button
                onClick={() => archiveMutation.mutate({ id: doc.id })}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Archive document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Document body ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 pb-32">
          {/* Cover image area (placeholder) */}
          <div className="mb-2">
            <span className="text-5xl cursor-pointer hover:opacity-80 transition-opacity">
              {doc.emoji}
            </span>
          </div>

          {/* Title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor.commands.focus("start");
              }
            }}
            placeholder="Untitled"
            rows={1}
            className="w-full resize-none overflow-hidden text-4xl md:text-5xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-6 leading-tight"
          />

          {/* Document meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8 pb-4 border-b border-border/50">
            <span>
              Created by{" "}
              <span className="font-medium text-foreground">{doc.author.name}</span>
            </span>
            <span>·</span>
            <span>{doc.workspace.name}</span>
          </div>

          {/* Editor */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar button ────────────────────────────────────────────────────────
function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?:  boolean;
  disabled?: boolean;
  title?:   string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-vault-100 text-vault-700 dark:bg-vault-900 dark:text-vault-300"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
