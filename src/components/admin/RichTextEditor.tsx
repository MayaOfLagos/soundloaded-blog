"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { EditorToolbar } from "./EditorToolbar";
import { MediaPickerModal } from "./MediaPickerModal";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your post content...",
  className,
}: RichTextEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "bg-muted rounded-lg p-4 font-mono text-sm" } },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl shadow-md max-w-full" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-brand underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert prose-headings:font-bold prose-a:text-brand prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-brand max-w-none min-h-[400px] px-4 py-3 outline-none",
      },
    },
    immediatelyRender: false,
  });

  const handleImageInsert = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  const onImageSelected = useCallback(
    (media: { url: string; filename: string } | { url: string; filename: string }[]) => {
      if (!editor) return;
      const item = Array.isArray(media) ? media[0] : media;
      editor.chain().focus().setImage({ src: item.url, alt: item.filename }).run();
    },
    [editor]
  );

  if (!editor) {
    return (
      <div
        className={cn(
          "border-border bg-background min-h-[460px] animate-pulse rounded-lg border",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("border-border bg-background overflow-hidden rounded-lg border", className)}>
      <EditorToolbar editor={editor} onImageInsert={handleImageInsert} />
      <EditorContent editor={editor} />
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={onImageSelected}
        allowedTypes={["IMAGE"]}
      />
    </div>
  );
}
