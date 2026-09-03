"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Table as TableIcon,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

function cleanHtmlString(rawHtml: string): string {
  // 1. Remove MS Word XML, comments, style tags, and meta tags
  let cleaned = rawHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<meta[\s\S]*?>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "");

  if (typeof window !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleaned, "text/html");

      // Remove Word's mso-list:Ignore spans (these contain hardcoded bullet/number labels like "1.   ")
      const msoIgnores = doc.querySelectorAll('span[style*="mso-list:Ignore"], span[style*="mso-list: Ignore"]');
      msoIgnores.forEach((el) => el.remove());

      const sanitizeNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || "";
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }

        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const style = el.getAttribute("style") || "";

        // Detect text formatting styles
        const isBold = /font-weight:\s*(?:bold|[6-9]00)/i.test(style) || ["b", "strong"].includes(tagName);
        const isItalic = /font-style:\s*italic/i.test(style) || ["i", "em"].includes(tagName);
        const isUnderline = /text-decoration(?:-line)?:\s*[^;]*underline/i.test(style) || tagName === "u";
        const isStrike = /text-decoration(?:-line)?:\s*[^;]*line-through/i.test(style) || ["s", "strike", "del"].includes(tagName);

        // Detect alignment
        let textAlign = "";
        const alignMatch = style.match(/text-align:\s*(center|right|justify|left)/i);
        if (alignMatch) textAlign = alignMatch[1].toLowerCase();

        // Detect margin-left indent
        let indentPx = 0;
        const marginMatch = style.match(/margin-left:\s*([0-9\.]+)(pt|px|in|cm|mm|em)/i);
        if (marginMatch) {
          const val = parseFloat(marginMatch[1]);
          const unit = marginMatch[2].toLowerCase();
          if (unit === "pt") indentPx = Math.round(val * 1.33);
          else if (unit === "px") indentPx = Math.round(val);
          else if (unit === "in") indentPx = Math.round(val * 96);
          else if (unit === "cm") indentPx = Math.round(val * 37.8);
          else if (unit === "mm") indentPx = Math.round(val * 3.78);
          else if (unit === "em") indentPx = Math.round(val * 16);
        }

        // Recursively sanitize children
        let childrenContent = "";
        el.childNodes.forEach((child) => {
          childrenContent += sanitizeNode(child);
        });

        // Wrap formatting
        let formattedContent = childrenContent;
        if (isStrike && !["s", "strike", "del"].includes(tagName)) formattedContent = `<s>${formattedContent}</s>`;
        if (isUnderline && tagName !== "u") formattedContent = `<u>${formattedContent}</u>`;
        if (isItalic && !["i", "em"].includes(tagName)) formattedContent = `<em>${formattedContent}</em>`;
        if (isBold && !["b", "strong"].includes(tagName)) formattedContent = `<strong>${formattedContent}</strong>`;

        if (tagName === "li") {
          let clean = formattedContent.trim();
          clean = clean.replace(/^(\s*(?:<[^>]+>\s*)*)(?:[0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s*/i, "$1");
          clean = clean.replace(/^(\s*(?:<[^>]+>\s*)*)[•\-\*o–—]\s*/i, "$1");
          return `<li>${clean}</li>`;
        }

        if (tagName === "ul") {
          return `<ul>${childrenContent}</ul>`;
        }
        if (tagName === "ol") {
          const typeAttr = el.getAttribute("type");
          const listStyle = typeAttr
            ? ` style="list-style-type: ${
                typeAttr === "a"
                  ? "lower-alpha"
                  : typeAttr === "A"
                  ? "upper-alpha"
                  : typeAttr === "i"
                  ? "lower-roman"
                  : typeAttr === "I"
                  ? "upper-roman"
                  : "decimal"
              };"`
            : "";
          return `<ol${listStyle}>${childrenContent}</ol>`;
        }

        // Table support
        if (tagName === "table") {
          return `<table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10.5pt;">${childrenContent}</table>`;
        }
        if (tagName === "thead" || tagName === "tbody" || tagName === "tfoot") {
          return `<${tagName}>${childrenContent}</${tagName}>`;
        }
        if (tagName === "tr") {
          return `<tr>${childrenContent}</tr>`;
        }
        if (tagName === "th" || tagName === "td") {
          const isHeader = tagName === "th";
          const colSpan = el.getAttribute("colspan") ? ` colspan="${el.getAttribute("colspan")}"` : "";
          const rowSpan = el.getAttribute("rowspan") ? ` rowspan="${el.getAttribute("rowspan")}"` : "";
          const borderStyle = "border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;";
          const fontStyle = isHeader ? " font-weight: bold; background-color: #f8fafc;" : "";
          return `<${tagName}${colSpan}${rowSpan} style="${borderStyle}${fontStyle}">${formattedContent || "&nbsp;"}</${tagName}>`;
        }

        if (tagName === "br") {
          return "<br />";
        }

        // Heading tags
        if (/^h[1-6]$/.test(tagName)) {
          return `<p style="font-size: 11pt; font-weight: bold; margin: 6px 0 2px 0;">${formattedContent}</p>`;
        }

        // Paragraphs & Word list paragraphs
        if (tagName === "p" || tagName === "div") {
          const rawText = el.textContent || "";
          const cleanText = rawText.trim();
          if (!cleanText && !childrenContent.includes("<img") && !childrenContent.includes("<table")) {
            return "";
          }

          const isWordList = (el.getAttribute("class") || "").includes("MsoListParagraph") || /mso-list:/i.test(style);
          const bulletMatch = cleanText.match(/^([•\-\*o–—])\s+(.*)$/);
          const orderedMatch = cleanText.match(/^([0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s+(.*)$/);

          if (bulletMatch || (isWordList && !orderedMatch)) {
            const itemHtml = formattedContent.replace(/^(\s*(?:<[^>]+>\s*)*)[•\-\*o–—]\s*/i, "$1").trim();
            const indentAttr = indentPx > 15 ? ` style="margin-left: ${indentPx}px;"` : "";
            return `<ul${indentAttr}><li>${itemHtml || cleanText}</li></ul>`;
          }

          if (orderedMatch) {
            const marker = orderedMatch[1];
            let listStyleType = "decimal";
            if (/^[0-9]+$/.test(marker)) listStyleType = "decimal";
            else if (/^[iIvVxX]+$/.test(marker)) listStyleType = "lower-roman";
            else if (/^[a-z]$/.test(marker)) listStyleType = "lower-alpha";
            else if (/^[A-Z]$/.test(marker)) listStyleType = "upper-alpha";

            const itemHtml = formattedContent.replace(/^(\s*(?:<[^>]+>\s*)*)(?:[0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s*/i, "$1").trim();
            const indentAttr = indentPx > 15 ? ` margin-left: ${indentPx}px;` : "";
            return `<ol style="list-style-type: ${listStyleType};${indentAttr}"><li>${itemHtml || orderedMatch[2]}</li></ol>`;
          }

          let pStyle = "";
          if (textAlign && textAlign !== "left") pStyle += `text-align: ${textAlign}; `;
          if (indentPx > 15) pStyle += `margin-left: ${indentPx}px; `;
          const styleAttr = pStyle ? ` style="${pStyle.trim()}"` : "";

          return `<p${styleAttr}>${formattedContent}</p>`;
        }

        return formattedContent;
      };

      let result = "";
      doc.body.childNodes.forEach((child) => {
        result += sanitizeNode(child);
      });

      // Post-sanitize tag spacing and merge adjacent lists
      result = result
        .replace(/<\/ol>\s*<ol style="list-style-type: decimal;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: lower-alpha;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: upper-alpha;">/gi, "")
        .replace(/<\/ol>\s*<ol style="list-style-type: lower-roman;">/gi, "")
        .replace(/<\/ol>\s*<ol>/gi, "")
        .replace(/<\/ul>\s*<ul>/gi, "")
        .replace(/<p>\s*<\/p>/g, "")
        .replace(/(<br\s*\/?>\s*){3,}/g, "<br /><br />");

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
          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
          : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
      <Icon size={14} />
    </button>
  );
}

export default function SimpleRichEditor({
  value,
  onChange,
  placeholder = "Tulis konten di sini atau paste dari Word...",
  className,
  hasError = false,
  minHeight = 160,
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const lastValueRef = useRef<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (lastValueRef.current === null || (value !== lastValueRef.current && el.innerHTML !== value)) {
      el.innerHTML = value || "";
      lastValueRef.current = value || "";
    }
  }, [value]);

  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }, []);

  const execCmd = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      const html = editorRef.current?.innerHTML || "";
      lastValueRef.current = html;
      onChange(html);
      updateActiveFormats();
    },
    [onChange, updateActiveFormats]
  );

  const insertTable = useCallback(() => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10.5pt;">
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; background-color: #f8fafc; text-align: left;">No.</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; background-color: #f8fafc; text-align: left;">Nama / Agenda</th>
            <th style="border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; background-color: #f8fafc; text-align: left;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">1.</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">Item 1</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">-</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">2.</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">Item 2</td>
            <td style="border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top;">-</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, tableHtml);
    const html = editorRef.current?.innerHTML || "";
    lastValueRef.current = html;
    onChange(html);
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

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
      // Use cleanHtmlString on plaintext to automatically convert plain lists/indents to HTML
      const plainAsHtml = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .split(/\r?\n/)
        .map((line) => {
          const indentMatch = line.match(/^(\s+)/);
          const indentPx = indentMatch ? Math.min(indentMatch[1].length * 12, 60) : 0;
          const style = indentPx > 0 ? ` style="margin-left: ${indentPx}px;"` : "";
          return `<p${style}>${line.trim()}</p>`;
        })
        .join("");
      const cleanHtml = cleanHtmlString(plainAsHtml);
      document.execCommand("insertHTML", false, cleanHtml);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          document.execCommand("outdent", false, undefined);
        } else {
          document.execCommand("indent", false, undefined);
        }
        updateActiveFormats();
      }
    },
    [updateActiveFormats]
  );

  const toolbarGroups: ToolbarButtonProps[][] = [
    [
      { icon: Bold, cmd: "bold", title: "Tebal (Ctrl+B)", onExec: execCmd, isActive: activeFormats.bold },
      { icon: Italic, cmd: "italic", title: "Miring (Ctrl+I)", onExec: execCmd, isActive: activeFormats.italic },
      { icon: Underline, cmd: "underline", title: "Garis Bawah (Ctrl+U)", onExec: execCmd, isActive: activeFormats.underline },
      { icon: Strikethrough, cmd: "strikeThrough", title: "Coretan", onExec: execCmd, isActive: activeFormats.strikeThrough },
    ],
    [
      { icon: AlignLeft, cmd: "justifyLeft", title: "Rata Kiri", onExec: execCmd, isActive: activeFormats.justifyLeft },
      { icon: AlignCenter, cmd: "justifyCenter", title: "Rata Tengah", onExec: execCmd, isActive: activeFormats.justifyCenter },
      { icon: AlignRight, cmd: "justifyRight", title: "Rata Kanan", onExec: execCmd, isActive: activeFormats.justifyRight },
      { icon: AlignJustify, cmd: "justifyFull", title: "Rata Kanan-Kiri", onExec: execCmd, isActive: activeFormats.justifyFull },
    ],
    [
      { icon: List, cmd: "insertUnorderedList", title: "Daftar Bullet", onExec: execCmd, isActive: activeFormats.insertUnorderedList },
      { icon: ListOrdered, cmd: "insertOrderedList", title: "Daftar Nomor", onExec: execCmd, isActive: activeFormats.insertOrderedList },
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
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />}
            {group.map((btn) => (
              <ToolbarButton key={btn.cmd} {...btn} />
            ))}
          </React.Fragment>
        ))}

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />

        <button
          type="button"
          title="Sisipkan Tabel"
          onMouseDown={(e) => {
            e.preventDefault();
            insertTable();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <TableIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px]">Tabel</span>
        </button>

        <div className="flex-1" />

        <button
          type="button"
          title="Hapus format yang dipilih"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("removeFormat");
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Eraser size={12} />
          Bersihkan
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
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
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
          "[&_p]:my-1 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5",
          "[&_li]:leading-relaxed [&_li]:my-0.5",
          "[&_b]:font-bold [&_strong]:font-bold",
          "[&_i]:italic [&_em]:italic",
          "[&_u]:underline",
          "[&_s]:line-through",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-2",
          "[&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:p-1.5 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:font-bold [&_th]:text-left",
          "[&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-1.5 [&_td]:align-top"
        )}
      />
    </div>
  );
}

