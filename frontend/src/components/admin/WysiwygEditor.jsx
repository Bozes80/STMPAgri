import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Minus, Undo, Redo, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api, { formatApiError } from "@/lib/api";

function ToolBtn({ active, onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 w-8 grid place-items-center rounded-md transition-colors ${
        active ? "bg-[#0E7A3A] text-white" : "text-foreground/70 hover:bg-muted hover:text-foreground"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/**
 * Éditeur riche TipTap. `value` = HTML string. `onChange(html)` appelé à chaque frappe.
 * Prise en charge : titres, gras/italique/souligné, listes, alignement, citation, code,
 * liens, images (upload direct via /api/admin/upload), séparateur horizontal, undo/redo.
 */
export default function WysiwygEditor({ value = "", onChange, placeholder = "Rédigez le contenu…", testid = "wysiwyg" }) {
  const fileRef = useRef(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "rounded-lg my-3" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
  });

  // Sync content quand value change de l'extérieur (chargement d'une page en édition)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "", false);
  }, [value, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return <div className="rounded-lg border border-border h-64 grid place-items-center text-muted-foreground text-sm">Initialisation de l'éditeur…</div>;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien", prev || "https://");
    if (url === null) return;
    if (url === "") return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const abs = data.url.startsWith("/api/")
        ? `${process.env.REACT_APP_BACKEND_URL}${data.url}`
        : data.url;
      editor.chain().focus().setImage({ src: abs, alt: file.name }).run();
      toast.success("Image insérée.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      uploadingRef.current = false;
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background" data-testid={testid}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
        <ToolBtn title="Titre 1" active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Titre 2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Titre 3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolBtn>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolBtn title="Gras" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Italique" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Souligné" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolBtn>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolBtn title="Liste à puces" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Liste ordonnée" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolBtn>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolBtn title="Aligner à gauche" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Centrer" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Aligner à droite" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></ToolBtn>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolBtn title="Citation" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Bloc de code" active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Lien" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Image" onClick={() => fileRef.current?.click()}><ImageIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Séparateur"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolBtn>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolBtn title="Annuler" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Rétablir" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolBtn>
      </div>
      <EditorContent
        editor={editor}
        className="tiptap-content px-4 py-3 min-h-[280px] prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:min-h-[260px] [&_.ProseMirror]:outline-none"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => uploadImage(e.target.files?.[0])}
        className="hidden"
        data-testid={`${testid}-image-input`}
      />
    </div>
  );
}
