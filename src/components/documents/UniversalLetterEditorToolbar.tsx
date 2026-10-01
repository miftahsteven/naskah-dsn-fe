"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
  Minus,
  Rows,
  Columns,
  Trash2,
  Highlighter,
  Palette,
  FileCheck2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZER: Membersihkan teks/HTML dari MS Word, PDF, dan sumber eksternal
// ─────────────────────────────────────────────────────────────────────────────
export function cleanPastedHtmlAndText(rawHtml: string, plainText?: string): string {
  // Jika HTML kosong tapi ada plainText (misal paste dari PDF atau Notepad)
  if (!rawHtml && plainText) {
    const lines = plainText.split(/\r?\n/);
    let htmlOutput = "";
    let currentParagraph: string[] = [];
    let inList = false;
    let listType = "ul";

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) {
          htmlOutput += `<p style="text-align: justify; margin-bottom: 6px; line-height: 1.35;">${text}</p>`;
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (inList) {
        htmlOutput += `</${listType}>`;
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      // Deteksi list item
      const bulletMatch = line.match(/^([•\-\*o–—])\s+(.*)$/);
      const orderedMatch = line.match(/^([0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s+(.*)$/);

      if (bulletMatch) {
        flushParagraph();
        if (!inList || listType !== "ul") {
          flushList();
          htmlOutput += `<ul style="margin: 6px 0; padding-left: 24px; line-height: 1.35;">`;
          inList = true;
          listType = "ul";
        }
        htmlOutput += `<li style="margin-bottom: 4px; text-align: justify;">${bulletMatch[2]}</li>`;
      } else if (orderedMatch) {
        flushParagraph();
        if (!inList || listType !== "ol") {
          flushList();
          htmlOutput += `<ol style="margin: 6px 0; padding-left: 24px; line-height: 1.35;">`;
          inList = true;
          listType = "ol";
        }
        htmlOutput += `<li style="margin-bottom: 4px; text-align: justify;">${orderedMatch[2]}</li>`;
      } else {
        flushList();
        // Cek apakah kalimat sebelumnya belum selesai (PDF line wrap)
        const lastWord = currentParagraph.length > 0 ? currentParagraph[currentParagraph.length - 1] : "";
        const endsWithPunctuation = /[.!?:;]$/.test(lastWord);
        if (currentParagraph.length > 0 && !endsWithPunctuation && !/^[A-Z0-9]/.test(line)) {
          currentParagraph.push(line);
        } else {
          flushParagraph();
          currentParagraph.push(line);
        }
      }
    }

    flushParagraph();
    flushList();
    return htmlOutput;
  }

  // 1. Bersihkan komentar XML dan tag Office
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

      // Hapus span buatan Word yang berisi nomor/bullet manual (mso-list:Ignore)
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

        // Deteksi format teks dasar
        const isBold = /font-weight:\s*(?:bold|[6-9]00)/i.test(style) || ["b", "strong"].includes(tagName);
        const isItalic = /font-style:\s*italic/i.test(style) || ["i", "em"].includes(tagName);
        const isUnderline = /text-decoration(?:-line)?:\s*[^;]*underline/i.test(style) || tagName === "u";
        const isStrike = /text-decoration(?:-line)?:\s*[^;]*line-through/i.test(style) || ["s", "strike", "del"].includes(tagName);

        // Deteksi alignment
        let textAlign = "";
        const alignMatch = style.match(/text-align:\s*(center|right|justify|left)/i);
        if (alignMatch) textAlign = alignMatch[1].toLowerCase();

        // Recursively sanitize children
        let childrenContent = "";
        el.childNodes.forEach((child) => {
          childrenContent += sanitizeNode(child);
        });

        // Terapkan tag format
        let formatted = childrenContent;
        if (isStrike && !["s", "strike", "del"].includes(tagName)) formatted = `<s>${formatted}</s>`;
        if (isUnderline && tagName !== "u") formatted = `<u>${formatted}</u>`;
        if (isItalic && !["i", "em"].includes(tagName)) formatted = `<em>${formatted}</em>`;
        if (isBold && !["b", "strong"].includes(tagName)) formatted = `<strong>${formatted}</strong>`;

        // List item
        if (tagName === "li") {
          let clean = formatted.trim();
          clean = clean.replace(/^(\s*(?:<[^>]+>\s*)*)(?:[0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s*/i, "$1");
          clean = clean.replace(/^(\s*(?:<[^>]+>\s*)*)[•\-\*o–—]\s*/i, "$1");
          return `<li style="margin-bottom: 4px; text-align: justify;">${clean}</li>`;
        }

        if (tagName === "ul") {
          return `<ul style="margin: 6px 0; padding-left: 24px; line-height: 1.35;">${childrenContent}</ul>`;
        }

        if (tagName === "ol") {
          return `<ol style="margin: 6px 0; padding-left: 24px; line-height: 1.35;">${childrenContent}</ol>`;
        }

        // Table
        if (tagName === "table") {
          return `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; line-height: 1.35;">${childrenContent}</table>`;
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
          const borderStyle = "border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;";
          const bgStyle = isHeader ? " font-weight: bold; background-color: #f8fafc;" : "";
          return `<${tagName}${colSpan}${rowSpan} style="${borderStyle}${bgStyle}">${formatted || "&nbsp;"}</${tagName}>`;
        }

        if (tagName === "br") {
          return "<br />";
        }

        if (tagName === "hr") {
          return `<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 14px 0;" />`;
        }

        // Headings
        if (/^h[1-6]$/.test(tagName)) {
          const level = tagName[1];
          let size = "12pt";
          if (level === "1") size = "13pt";
          if (level === "2") size = "12pt";
          if (level === "3") size = "11pt";
          if (level >= "4") size = "10.5pt";
          return `<p style="font-size: ${size}; font-weight: bold; margin: 8px 0 4px 0; line-height: 1.35;">${formatted}</p>`;
        }

        // Blockquote
        if (tagName === "blockquote") {
          return `<blockquote style="border-left: 3px solid #006633; padding-left: 14px; margin: 8px 0; color: #4b5563; font-style: italic;">${formatted}</blockquote>`;
        }

        // Paragraphs & Divs
        if (tagName === "p" || tagName === "div") {
          const rawText = el.textContent || "";
          const cleanText = rawText.trim();
          if (!cleanText && !childrenContent.includes("<img") && !childrenContent.includes("<table")) {
            return "";
          }

          // Deteksi list bawaan Word (MsoListParagraph)
          const isWordList = (el.getAttribute("class") || "").includes("MsoListParagraph") || /mso-list:/i.test(style);
          const bulletMatch = cleanText.match(/^([•\-\*o–—])\s+(.*)$/);
          const orderedMatch = cleanText.match(/^([0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s+(.*)$/);

          if (bulletMatch || (isWordList && !orderedMatch)) {
            const itemHtml = formatted.replace(/^(\s*(?:<[^>]+>\s*)*)[•\-\*o–—]\s*/i, "$1").trim();
            return `<ul style="margin: 6px 0; padding-left: 24px; line-height: 1.35;"><li style="margin-bottom: 4px; text-align: justify;">${itemHtml || cleanText}</li></ul>`;
          }

          if (orderedMatch) {
            const marker = orderedMatch[1];
            let listStyleType = "decimal";
            if (/^[0-9]+$/.test(marker)) listStyleType = "decimal";
            else if (/^[iIvVxX]+$/.test(marker)) listStyleType = "lower-roman";
            else if (/^[a-z]$/.test(marker)) listStyleType = "lower-alpha";
            else if (/^[A-Z]$/.test(marker)) listStyleType = "upper-alpha";

            const itemHtml = formatted.replace(/^(\s*(?:<[^>]+>\s*)*)(?:[0-9]+|[a-zA-Z]+|[iIvVxX]+)[\.\)]\s*/i, "$1").trim();
            return `<ol style="list-style-type: ${listStyleType}; margin: 6px 0; padding-left: 24px; line-height: 1.35;"><li style="margin-bottom: 4px; text-align: justify;">${itemHtml || orderedMatch[2]}</li></ol>`;
          }

          let pStyle = "margin-top: 4px; margin-bottom: 6px; line-height: 1.35;";
          if (textAlign) {
            pStyle += ` text-align: ${textAlign};`;
          } else {
            pStyle += " text-align: justify;";
          }

          return `<p style="${pStyle}">${formatted}</p>`;
        }

        return formatted;
      };

      let result = "";
      doc.body.childNodes.forEach((child) => {
        result += sanitizeNode(child);
      });

      // Gabungkan list berdekatan
      result = result
        .replace(/<\/ol>\s*<ol[^>]*>/gi, "")
        .replace(/<\/ul>\s*<ul[^>]*>/gi, "")
        .replace(/<p style="[^"]*">\s*<\/p>/g, "")
        .replace(/(<br\s*\/?>\s*){3,}/g, "<br /><br />");

      return result.trim();
    } catch (e) {
      console.warn("Paste sanitization error:", e);
    }
  }

  return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS INTERFACE
// ─────────────────────────────────────────────────────────────────────────────
export interface UniversalLetterEditorToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContentChange?: (html: string) => void;
  className?: string;
  showSnippetMenu?: boolean;
}

export default function UniversalLetterEditorToolbar({
  editorRef,
  onContentChange,
  className,
  showSnippetMenu = true
}: UniversalLetterEditorToolbarProps) {
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("10.5pt");
  const [paragraphFormat, setParagraphFormat] = useState("p");
  const [lineHeight, setLineHeight] = useState("1.35");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const updateFormats = useCallback(() => {
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

  useEffect(() => {
    const handleSelectionChange = () => updateFormats();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateFormats]);

  const exec = useCallback(
    (command: string, value: string | undefined = undefined) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand(command, false, value);
      const html = editorRef.current.innerHTML;
      if (onContentChange) onContentChange(html);
      updateFormats();
    },
    [editorRef, onContentChange, updateFormats]
  );

  // Paragraf / Heading
  const handleParagraphFormatChange = (tag: string) => {
    setParagraphFormat(tag);
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (tag === "blockquote") {
      exec("formatBlock", "blockquote");
    } else if (tag === "p") {
      exec("formatBlock", "p");
    } else {
      exec("formatBlock", tag);
    }
  };

  // Font Family
  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    if (!editorRef.current) return;
    editorRef.current.focus();
    exec("fontName", font);
  };

  // Font Size
  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement("span");
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      exec("fontSize", "3");
    }
    if (onContentChange) onContentChange(editorRef.current.innerHTML);
  };

  // Line Height
  const handleLineHeightChange = (lh: string) => {
    setLineHeight(lh);
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let parent = sel.anchorNode as HTMLElement | null;
    while (parent && parent !== editorRef.current && !["P", "DIV", "LI", "TD", "BLOCKQUOTE"].includes(parent.tagName)) {
      parent = parent.parentElement;
    }
    if (parent && parent !== editorRef.current) {
      parent.style.lineHeight = lh;
      if (onContentChange) onContentChange(editorRef.current.innerHTML);
    }
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number, hasHeader: boolean) => {
    if (!editorRef.current) return;
    let html = `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; line-height: 1.35;">`;
    if (hasHeader) {
      html += `<thead><tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<th style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; background-color: #f8fafc; text-align: left;">Header ${c + 1}</th>`;
      }
      html += `</tr></thead>`;
    }
    html += `<tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;">${c === 0 ? r + 1 + "." : "Isi " + (c + 1)}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p style="margin-top: 6px;"></p>`;

    editorRef.current.focus();
    document.execCommand("insertHTML", false, html);
    setShowTableModal(false);
    if (onContentChange) onContentChange(editorRef.current.innerHTML);
    showToast("Tabel berhasil disisipkan");
  };

  // Quick Table Row & Column actions
  const modifyTable = (action: "add-row" | "add-col" | "del-row" | "del-col" | "del-table") => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: HTMLElement | null = sel.anchorNode as HTMLElement | null;
    let td: HTMLTableCellElement | null = null;
    let tr: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.tagName === "TD" || node.tagName === "TH") td = node as HTMLTableCellElement;
      if (node.tagName === "TR") tr = node as HTMLTableRowElement;
      if (node.tagName === "TABLE") {
        table = node as HTMLTableElement;
        break;
      }
      node = node.parentElement;
    }

    if (!table || !tr) {
      showToast("Letakkan kursor di dalam tabel terlebih dahulu");
      return;
    }

    if (action === "add-row") {
      const newRow = tr.cloneNode(true) as HTMLTableRowElement;
      Array.from(newRow.cells).forEach((cell) => {
        cell.innerHTML = "&nbsp;";
      });
      tr.parentNode?.insertBefore(newRow, tr.nextSibling);
      showToast("Baris berhasil ditambahkan");
    } else if (action === "add-col" && td) {
      const colIndex = td.cellIndex;
      Array.from(table.rows).forEach((row) => {
        const isHead = row.parentNode?.nodeName === "THEAD" || row.cells[0]?.tagName === "TH";
        const newCell = document.createElement(isHead ? "th" : "td");
        newCell.style.cssText = "border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;";
        if (isHead) {
          newCell.style.fontWeight = "bold";
          newCell.style.backgroundColor = "#f8fafc";
          newCell.innerText = "Kolom Baru";
        } else {
          newCell.innerHTML = "&nbsp;";
        }
        row.insertBefore(newCell, row.cells[colIndex + 1] || null);
      });
      showToast("Kolom berhasil ditambahkan");
    } else if (action === "del-row") {
      if (table.rows.length <= 1) {
        table.remove();
        showToast("Tabel dihapus");
      } else {
        tr.remove();
        showToast("Baris dihapus");
      }
    } else if (action === "del-col" && td) {
      const colIndex = td.cellIndex;
      Array.from(table.rows).forEach((row) => {
        if (row.cells[colIndex]) row.cells[colIndex].remove();
      });
      showToast("Kolom dihapus");
    } else if (action === "del-table") {
      table.remove();
      showToast("Tabel dihapus");
    }

    if (onContentChange) onContentChange(editorRef.current.innerHTML);
  };

  // Quick Snippets
  const insertSnippet = (type: "salam-buka" | "salam-tutup" | "divider" | "tabel-agenda" | "tembusan") => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let snippetHtml = "";
    if (type === "salam-buka") {
      snippetHtml = `<p style="text-align: justify; margin-bottom: 6px; line-height: 1.35;"><em>Assalamu’alaikum Warahmatullah Wabarakatuh,</em></p><p style="text-align: justify; text-indent: 30px; margin-bottom: 6px; line-height: 1.35;">Dengan hormat,</p>`;
    } else if (type === "salam-tutup") {
      snippetHtml = `<p style="text-align: justify; text-indent: 30px; margin-top: 8px; margin-bottom: 6px; line-height: 1.35;">Demikian surat ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p><p style="text-align: justify; margin-top: 8px; margin-bottom: 12px; line-height: 1.35;"><em>Wassalamu’alaikum Warahmatullah Wabarakatuh.</em></p>`;
    } else if (type === "divider") {
      snippetHtml = `<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" /><p></p>`;
    } else if (type === "tabel-agenda") {
      snippetHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; line-height: 1.35;">
          <tbody>
            <tr><td style="width: 130px; font-weight: bold; padding: 4px 0;">Hari / Tanggal</td><td style="width: 15px; padding: 4px 0;">:</td><td style="padding: 4px 0;">Senin, 01 Oktober 2026</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Waktu</td><td style="padding: 4px 0;">:</td><td style="padding: 4px 0;">09.00 WIB - Selesai</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Tempat</td><td style="padding: 4px 0;">:</td><td style="padding: 4px 0;">Ruang Rapat Utama DSN-MUI / Zoom Meeting</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Agenda</td><td style="padding: 4px 0;">:</td><td style="padding: 4px 0;">Koordinasi & Pembahasan Surat Keluar</td></tr>
          </tbody>
        </table>
        <p></p>
      `;
    } else if (type === "tembusan") {
      snippetHtml = `
        <div style="margin-top: 24px; font-size: 9.5pt; color: #374151; page-break-inside: avoid;">
          <p style="font-weight: bold; margin-bottom: 4px; text-decoration: underline;">Tembusan Yth:</p>
          <ol style="margin: 0; padding-left: 20px; line-height: 1.35;">
            <li>Ketua Umum Majelis Ulama Indonesia (MUI)</li>
            <li>Arsip / Sekretariat DSN-MUI</li>
          </ol>
        </div>
        <p></p>
      `;
    }

    document.execCommand("insertHTML", false, snippetHtml);
    setShowSnippets(false);
    if (onContentChange) onContentChange(editorRef.current.innerHTML);
    showToast("Komponen surat berhasil disisipkan");
  };

  return (
    <div className={cn("relative z-20 flex flex-col gap-1 w-full", className)}>
      {/* Toast Notification */}
      {notification && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
          <Sparkles size={12} className="text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Main Toolbar Panel */}
      <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => exec("undo")}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => exec("redo")}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Paragraph & Heading Dropdown */}
        <div className="relative">
          <select
            value={paragraphFormat}
            onChange={(e) => handleParagraphFormatChange(e.target.value)}
            className="h-8 pl-2 pr-6 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
            title="Format Paragraf"
          >
            <option value="p">Paragraf Normal</option>
            <option value="h3">Judul Bagian (H3)</option>
            <option value="h4">Sub Judul (H4)</option>
            <option value="h5">Poin Judul (H5)</option>
            <option value="blockquote">Kutipan</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Font Family Dropdown */}
        <div className="relative">
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="h-8 pl-2 pr-6 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
            title="Jenis Huruf"
          >
            <option value="Arial">Arial (DSN-MUI)</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Calibri">Calibri</option>
            <option value="Georgia">Georgia</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="h-8 pl-2 pr-6 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
            title="Ukuran Font"
          >
            <option value="9pt">9 pt</option>
            <option value="10pt">10 pt</option>
            <option value="10.5pt">10.5 pt (Standar)</option>
            <option value="11pt">11 pt</option>
            <option value="12pt">12 pt</option>
            <option value="14pt">14 pt</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Basic Text Formatting */}
        <button
          type="button"
          onClick={() => exec("bold")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.bold ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Tebal (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.italic ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Miring (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.underline ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Garis Bawah (Ctrl+U)"
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("strikeThrough")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.strikeThrough ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Coret Teks"
        >
          <Strikethrough size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.justifyLeft ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Rata Kiri"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.justifyCenter ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Rata Tengah"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyRight")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.justifyRight ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Rata Kanan"
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyFull")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.justifyFull ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Rata Kanan-Kiri (Justify - Standar Surat)"
        >
          <AlignJustify size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Lists & Indentation */}
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.insertUnorderedList ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            activeFormats.insertOrderedList ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          )}
          title="Numbered List (1, 2, 3)"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("outdent")}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          title="Kurangi Indentasi (Shift+Tab)"
        >
          <Outdent size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec("indent")}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          title="Tambah Indentasi (Tab)"
        >
          <Indent size={14} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Table Master Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTableModal(!showTableModal)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-all cursor-pointer"
            title="Kelola & Sisipkan Tabel"
          >
            <TableIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Tabel</span>
            <ChevronDown size={11} />
          </button>

          {/* Table Management Popover */}
          {showTableModal && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 w-64 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>Sisipkan Tabel Baru</span>
                <span className="text-[10px] text-slate-400 font-mono">{tableRows} x {tableCols}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">Baris</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">Kolom</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tbl-header"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="tbl-header" className="text-[11px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                  Gunakan Baris Header (Abu-abu)
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleInsertTable(tableRows, tableCols, tableHeader)}
                className="w-full py-1.5 bg-[#006633] text-white rounded-xl font-bold text-xs hover:bg-[#004d26] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                Sisipkan Tabel
              </button>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi Tabel Aktif</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => modifyTable("add-row")}
                    className="flex items-center gap-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  >
                    <Rows size={11} className="text-emerald-600" /> + Baris
                  </button>
                  <button
                    type="button"
                    onClick={() => modifyTable("add-col")}
                    className="flex items-center gap-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  >
                    <Columns size={11} className="text-emerald-600" /> + Kolom
                  </button>
                  <button
                    type="button"
                    onClick={() => modifyTable("del-row")}
                    className="flex items-center gap-1 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-600"
                  >
                    <Trash2 size={11} /> - Baris
                  </button>
                  <button
                    type="button"
                    onClick={() => modifyTable("del-col")}
                    className="flex items-center gap-1 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-600"
                  >
                    <Trash2 size={11} /> - Kolom
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Surat Snippets */}
        {showSnippetMenu && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSnippets(!showSnippets)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              title="Komponen Format Surat"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Komponen Surat</span>
              <ChevronDown size={11} />
            </button>

            {showSnippets && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 w-56 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="p-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Sisipkan Komponen Surat
                </div>
                <button
                  type="button"
                  onClick={() => insertSnippet("salam-buka")}
                  className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  📝 Salam Pembuka Resmi
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("salam-tutup")}
                  className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  📝 Salam Penutup Resmi
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("tabel-agenda")}
                  className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  📅 Tabel Rapat / Agenda
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("tembusan")}
                  className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  📎 Blok Tembusan Surat
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("divider")}
                  className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-medium transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  ➖ Garis Pemisah (Divider)
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => {
            exec("removeFormat");
            showToast("Format teks dibersihkan");
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold cursor-pointer"
          title="Bersihkan format teks yang dipilih"
        >
          <Eraser size={13} />
          <span className="text-[11px] hidden sm:inline">Bersihkan</span>
        </button>
      </div>

      {/* Word & PDF Paste Helper info badge */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 py-0.5">
        <span className="flex items-center gap-1">
          <FileCheck2 size={11} className="text-emerald-600" />
          <span>Mendukung copy-paste otomatis dari <strong>Microsoft Word</strong> &amp; <strong>PDF</strong> tanpa merusak tata letak.</span>
        </span>
        <span className="font-mono">Ukuran Standar: 10.5pt Arial</span>
      </div>
    </div>
  );
}
