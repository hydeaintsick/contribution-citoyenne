"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Saisissez votre message...",
  maxLength = 5000,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "fr-link",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      // Limiter la longueur du texte
      if (maxLength && text.length > maxLength) {
        const currentLength = text.length;
        const excess = currentLength - maxLength;
        const { from, to } = editor.state.selection;
        editor.commands.deleteRange({
          from: Math.max(0, to - excess),
          to,
        });
        return;
      }
      
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor__content",
        "data-placeholder": placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  const textLength = editor.getText().length;

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rich-text-editor__button ${
            editor.isActive("heading", { level: 1 }) ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Titre 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rich-text-editor__button ${
            editor.isActive("heading", { level: 2 }) ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Titre 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rich-text-editor__button ${
            editor.isActive("heading", { level: 3 }) ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Titre 3"
        >
          H3
        </button>
        <div className="rich-text-editor__separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rich-text-editor__button ${
            editor.isActive("bold") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Gras"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rich-text-editor__button ${
            editor.isActive("italic") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Italique"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rich-text-editor__button ${
            editor.isActive("underline") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Souligné"
        >
          <u>U</u>
        </button>
        <div className="rich-text-editor__separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rich-text-editor__button ${
            editor.isActive("bulletList") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Liste à puces"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rich-text-editor__button ${
            editor.isActive("orderedList") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Liste numérotée"
        >
          1.
        </button>
        <div className="rich-text-editor__separator" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Entrez l'URL du lien:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`rich-text-editor__button ${
            editor.isActive("link") ? "is-active" : ""
          }`}
          disabled={disabled}
          title="Lien"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="rich-text-editor__button"
          disabled={disabled || !editor.isActive("link")}
          title="Retirer le lien"
        >
          🔗✕
        </button>
      </div>
      <div className="rich-text-editor__editor">
        <EditorContent editor={editor} />
      </div>
      {maxLength && (
        <p className="fr-text--xs fr-text-mention--grey fr-mt-1w fr-mb-0">
          {textLength} / {maxLength} caractères
        </p>
      )}
      <style jsx global>{`
        .rich-text-editor {
          border: 1px solid var(--border-default-grey);
          border-radius: 4px;
          background-color: white;
        }

        .rich-text-editor__toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid var(--border-default-grey);
          background-color: var(--background-alt-grey);
        }

        .rich-text-editor__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
          height: 2rem;
          padding: 0 0.5rem;
          border: 1px solid var(--border-default-grey);
          border-radius: 4px;
          background-color: white;
          color: var(--text-default-grey);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rich-text-editor__button:hover:not(:disabled) {
          background-color: var(--background-alt-grey);
        }

        .rich-text-editor__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rich-text-editor__button.is-active {
          background-color: var(--background-action-low-blue-france);
          color: var(--text-action-high-blue-france);
          border-color: var(--border-action-high-blue-france);
        }

        .rich-text-editor__separator {
          width: 1px;
          height: 1.5rem;
          background-color: var(--border-default-grey);
          margin: 0 0.25rem;
        }

        .rich-text-editor__editor {
          min-height: 200px;
        }

        .rich-text-editor__content {
          min-height: 200px;
          padding: 1rem;
          font-family: "Marianne", Arial, sans-serif;
          font-size: 1rem;
          line-height: 1.5rem;
          color: var(--text-default-grey);
          outline: none;
        }

        .rich-text-editor__content[data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: var(--text-mention-grey);
          pointer-events: none;
        }

        .rich-text-editor__content p {
          margin: 0 0 0.5rem 0;
        }

        .rich-text-editor__content p:last-child {
          margin-bottom: 0;
        }

        .rich-text-editor__content h1,
        .rich-text-editor__content h2,
        .rich-text-editor__content h3 {
          margin: 1rem 0 0.5rem 0;
          font-weight: 700;
        }

        .rich-text-editor__content h1:first-child,
        .rich-text-editor__content h2:first-child,
        .rich-text-editor__content h3:first-child {
          margin-top: 0;
        }

        .rich-text-editor__content h1 {
          font-size: 1.5rem;
        }

        .rich-text-editor__content h2 {
          font-size: 1.25rem;
        }

        .rich-text-editor__content h3 {
          font-size: 1.125rem;
        }

        .rich-text-editor__content ul,
        .rich-text-editor__content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .rich-text-editor__content a {
          color: var(--text-action-high-blue-france);
          text-decoration: underline;
        }

        .rich-text-editor__content a:hover {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
