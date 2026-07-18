"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Content, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";

import { uploadImage } from "@/app/admin/posts/upload";
import type { TiptapDoc } from "@/lib/blog/types";

/** Shared editor extensions (StarterKit v3 includes Link). Headings limited to 2–4. */
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: { openOnClick: false, HTMLAttributes: { rel: "noreferrer noopener", target: "_blank" } },
  }),
  Image.configure({ inline: false, allowBase64: false }),
  Placeholder.configure({ placeholder: "Write the article…" }),
];

const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };

export function TiptapEditor({
  value,
  onChange,
}: {
  value: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    content: (value ?? EMPTY_DOC) as Content,
    immediatelyRender: false, // required under Next SSR
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[320px] px-[18px] py-[16px] outline-none [&_h2]:text-[24px] [&_h2]:font-bold [&_h3]:text-[20px] [&_h3]:font-semibold [&_p]:my-[10px] [&_ul]:list-disc [&_ul]:pl-[24px] [&_ol]:list-decimal [&_ol]:pl-[24px] [&_blockquote]:border-l-4 [&_blockquote]:border-rebm-card-border [&_blockquote]:pl-[14px] [&_blockquote]:italic [&_a]:text-rebm-link [&_a]:underline [&_img]:rounded-[8px]",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as TiptapDoc),
  });

  if (!editor) return <div className="min-h-[360px] rounded-[10px] border border-rebm-card-border bg-white" />;

  async function handleFile(file: File) {
    setUploadError(null);
    const form = new FormData();
    form.set("file", file);
    const res = await uploadImage(form);
    if (!res.ok) {
      setUploadError(res.error);
      return;
    }
    editor?.chain().focus().setImage({ src: res.url }).run();
  }

  return (
    <div className="rounded-[10px] border border-rebm-card-border bg-white">
      <Toolbar editor={editor} onImageClick={() => fileInput.current?.click()} />
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <EditorContent editor={editor} />
      {uploadError && <p className="px-[18px] pb-[12px] text-[13px] text-red-600">{uploadError}</p>}
    </div>
  );
}

function Toolbar({ editor, onImageClick }: { editor: Editor; onImageClick: () => void }) {
  const btn = (active: boolean) =>
    `rounded-[6px] px-[9px] py-[5px] text-[14px] transition-colors ${
      active ? "bg-rebm-navy text-white" : "text-rebm-navy hover:bg-[#F0F2F4]"
    }`;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-[3px] border-b border-rebm-card-border p-[8px]">
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2">H2</button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3">H3</button>
      <Sep />
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><b>B</b></button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><i>I</i></button>
      <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough"><s>S</s></button>
      <Sep />
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bulleted list">• List</button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">1. List</button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote">❝</button>
      <Sep />
      <button type="button" className={btn(editor.isActive("link"))} onClick={setLink} aria-label="Link">Link</button>
      <button type="button" className={btn(false)} onClick={onImageClick} aria-label="Insert image">Image</button>
      <Sep />
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} aria-label="Undo">Undo</button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} aria-label="Redo">Redo</button>
    </div>
  );
}

const Sep = () => <span className="mx-[4px] h-[20px] w-px bg-rebm-card-border" />;
