"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Minus, Indent, Outdent } from "lucide-react";
import { cn } from "@/lib/utils";

function cleanHtmlString(rawHtml: string): string {
  // Remove MS Word XML/comments/styles metadata
  let cleaned = rawHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<xml>[\s\S]*?<\/xml>/g, "")
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<meta[\s\S]*?>/g, "");

  if (typeof window !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleaned, "text/html");
      
      const sanitizeNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || "";
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }

        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const allowedTags = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li"];

        // Get children content
        let childrenContent = "";
        el.childNodes.forEach((child) => {
          childrenContent += sanitizeNode(child);
        });

        if (tagName === "li") {
          // Strip leading list markers from list items to avoid double markers (e.g. 1. 1. Item)
          let cleanContent = childrenContent.trim();
          cleanContent = cleanContent.replace(/^([0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s+/, "");
          cleanContent = cleanContent.replace(/^([•\-\*o])\s+/, "");
          return `<li>${cleanContent}</li>`;
        }

        if (tagName === "p") {
          const rawText = el.textContent || "";
          const leadingSpaces = rawText.match(/^[\s\u00a0]*/)?.[0].length || 0;
          const cleanText = rawText.trim();
          
          // Match bullet markers: •, -, *, o
          const bulletMatch = cleanText.match(/^([•\-\*o])\s+(.*)$/);
          if (bulletMatch) {
            const indentStyle = leadingSpaces > 2 ? ' style="margin-left: 20px;"' : '';
            return `<ul${indentStyle}><li>${bulletMatch[2]}</li></ul>`;
          }
          
          // Match ordered markers: 1., a., i., A) etc.
          const orderedMatch = cleanText.match(/^([0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s+(.*)$/);
          if (orderedMatch) {
            const marker = orderedMatch[1];
            let listStyleType = 'decimal';
            if (/^[0-9]+$/.test(marker)) {
              listStyleType = 'decimal';
            } else if (/^[iIvVxX]+$/.test(marker)) {
              listStyleType = 'lower-roman';
            } else if (/^[a-z]$/.test(marker)) {
              listStyleType = 'lower-alpha';
            } else if (/^[A-Z]$/.test(marker)) {
              listStyleType = 'upper-alpha';
            }
            const indentStyle = leadingSpaces > 2 ? ` margin-left: 20px;` : '';
            return `<ol style="list-style-type: ${listStyleType};${indentStyle}"><li>${orderedMatch[2]}</li></ol>`;
          }
          
          return `<p>${childrenContent}</p>`;
        }

        if (allowedTags.includes(tagName)) {
          return `<${tagName}>${childrenContent}</${tagName}>`;
        }

        // Keep clean headers as bold paragraphs
        if (/^h[1-6]$/.test(tagName)) {
          return `<p><strong>${childrenContent}</strong></p>`;
        }

        // Strip structural table wrapper layouts but keep cells text separated
        if (["div", "tr", "table", "tbody"].includes(tagName)) {
          return childrenContent ? `<p>${childrenContent}</p>` : "";
        }
        if (tagName === "td" || tagName === "th") {
          return childrenContent + " ";
        }

        return childrenContent;
      };

      let result = "";
      doc.body.childNodes.forEach((child) => {
        result += sanitizeNode(child);
      });

      // Post-sanitize tag spacing and merge adjacent lists of matching styles
      result = result
        .replace(/<p>\s*<\/p>/g, "")
        .replace(/(<br\s*\/?>\s*){2,}/g, "<br />")
        .replace(/<\/ol>\s*<ol style="list-style-type: decimal;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: lower-alpha;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: upper-alpha;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: lower-roman;">/gi, "")
        .replace(/<\/ul>\s*<ul[^>]*>/gi, "");

      return result.trim();
    } catch (e) {
      console.error("Paste sanitization failed:", e);
    }
  }
  return cleaned;
}

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  minHeight?: number;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ size?: number }>;
  cmd: string;
  title: string;
  onExec: (cmd: string) => void;
  isActive?: boolean;
}

function ToolbarButton({ icon: Icon, cmd, title, onExec, isActive }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onExec(cmd);
      }}
      className={cn(
        "p-1.5 rounded-lg transition-all duration-150",
        isActive
          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
          : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
      )}
    >
      <Icon size={13} />
    </button>
  );
}

export default function SimpleRichEditor({
  value,
  onChange,
  placeholder = "Tulis konten di sini...",
  className,
  hasError = false,
  minHeight = 160,
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const lastValueRef = useRef(value);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastValueRef.current && el.innerHTML !== value) {
      el.innerHTML = value;
      lastValueRef.current = value;
    }
  }, [value]);

  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }, []);

  const execCmd = useCallback(
    (command: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, undefined);
      const html = editorRef.current?.innerHTML || "";
      lastValueRef.current = html;
      onChange(html);
      updateActiveFormats();
    },
    [onChange, updateActiveFormats]
  );

  const handleInput = useCallback(() => {
    if (!isComposingRef.current) {
      const html = editorRef.current?.innerHTML || "";
      lastValueRef.current = html;
      onChange(html);
    }
  }, [onChange]);

  const handleKeyUp = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  const handleMouseUp = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      const cleanHtml = cleanHtmlString(html);
      document.execCommand("insertHTML", false, cleanHtml);
    } else if (text) {
      // Use cleanHtmlString on plaintext to automatically convert plain lists to HTML
      const plainAsHtml = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .split(/\r?\n/)
        .map(line => `<p>${line}</p>`)
        .join("");
      const cleanHtml = cleanHtmlString(plainAsHtml);
      document.execCommand("insertHTML", false, cleanHtml);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand("outdent", false, undefined);
      } else {
        document.execCommand("indent", false, undefined);
      }
      updateActiveFormats();
    }
  }, [updateActiveFormats]);

  const toolbarGroups: ToolbarButtonProps[][] = [
    [
      { icon: Bold, cmd: "bold", title: "Bold (Ctrl+B)", onExec: execCmd, isActive: activeFormats.bold },
      { icon: Italic, cmd: "italic", title: "Italic (Ctrl+I)", onExec: execCmd, isActive: activeFormats.italic },
      { icon: Underline, cmd: "underline", title: "Underline (Ctrl+U)", onExec: execCmd, isActive: activeFormats.underline },
    ],
    [
      { icon: List, cmd: "insertUnorderedList", title: "Bullet List", onExec: execCmd, isActive: activeFormats.insertUnorderedList },
      { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered List", onExec: execCmd, isActive: activeFormats.insertOrderedList },
    ],
    [
      { icon: Outdent, cmd: "outdent", title: "Kurangi Indentasi (Shift+Tab)", onExec: execCmd },
      { icon: Indent, cmd: "indent", title: "Tambah Indentasi (Tab)", onExec: execCmd },
    ],
  ];

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-200 border",
        hasError
          ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900/40"
          : "border-slate-200 dark:border-slate-700 focus-within:border-emerald-400 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/30",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />}
            {group.map((btn) => (
              <ToolbarButton key={btn.cmd} {...btn} />
            ))}
          </React.Fragment>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          title="Hapus format"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("removeFormat");
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
        >
          <Minus size={11} />
          Clear
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInput();
        }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={cn(
          "w-full px-4 py-3 outline-none",
          "bg-slate-50 dark:bg-slate-900",
          "text-sm text-slate-800 dark:text-slate-200 leading-relaxed",
          "overflow-y-auto",
          "empty:before:content-[attr(data-placeholder)]",
          "empty:before:text-slate-400 dark:empty:before:text-slate-600",
          "empty:before:pointer-events-none empty:before:block",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          "[&_li]:leading-relaxed",
          "[&_b]:font-bold [&_strong]:font-bold",
          "[&_i]:italic [&_em]:italic",
          "[&_u]:underline"
        )}
      />
    </div>
  );
}
