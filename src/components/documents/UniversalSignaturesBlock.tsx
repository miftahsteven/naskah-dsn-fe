"use client";

import React from "react";
import { DocumentSignerItem, formatSignerTitle } from "@/lib/utils";

interface UniversalSignaturesBlockProps {
  signers: DocumentSignerItem[];
}

export const UniversalSignaturesBlock: React.FC<UniversalSignaturesBlockProps> = ({ signers }) => {
  if (!signers || signers.length === 0) {
    return null;
  }

  // 1. Single Signer Layout (Right aligned under official header)
  if (signers.length === 1) {
    const s = signers[0];
    const title = formatSignerTitle(s.title) || "Penandatangan 1,";
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", pageBreakInside: "avoid" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%" }}></td>
            <td style={{ width: "50%", verticalAlign: "top", padding: 0, textAlign: "right" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px", color: "#111827" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s.name}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // 2. Exactly 2 Signers Layout (Right-to-Left: Right = Penandatangan 1 under header; Left = Penandatangan 2)
  if (signers.length === 2) {
    const s1 = signers[0]; // Penandatangan 1 (Right under Header)
    const s2 = signers[1]; // Penandatangan 2 (Left)
    const title1 = formatSignerTitle(s1.title) || "Penandatangan 1,";
    const title2 = formatSignerTitle(s2.title) || "Penandatangan 2,";

    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", pageBreakInside: "avoid" }}>
        <tbody>
          <tr>
            {/* Left Column: Penandatangan 2 */}
            <td style={{ width: "48%", verticalAlign: "top", padding: 0, textAlign: "left" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ visibility: "hidden", fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title2}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s2.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s2.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s2.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s2.name}
                </span>
              </div>
            </td>
            {/* Right Column: Penandatangan 1 (with official header) */}
            <td style={{ width: "52%", verticalAlign: "top", padding: 0, textAlign: "right" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px", color: "#111827" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title1}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s1.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s1.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s1.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s1.name}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // 3. Exactly 3 Signers Layout (Right-to-Left: Right=Penandatangan 1, Center=Penandatangan 2, Left=Penandatangan 3)
  if (signers.length === 3) {
    const s1 = signers[0]; // Penandatangan 1 (Right under Header)
    const s2 = signers[1]; // Penandatangan 2 (Center)
    const s3 = signers[2]; // Penandatangan 3 (Left)
    const title1 = formatSignerTitle(s1.title) || "Penandatangan 1,";
    const title2 = formatSignerTitle(s2.title) || "Penandatangan 2,";
    const title3 = formatSignerTitle(s3.title) || "Penandatangan 3,";

    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", pageBreakInside: "avoid" }}>
        <tbody>
          <tr>
            {/* Left: Penandatangan 3 */}
            <td style={{ width: "33%", verticalAlign: "top", padding: 0, textAlign: "left" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ visibility: "hidden", fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title3}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s3.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s3.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s3.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s3.name}
                </span>
              </div>
            </td>
            {/* Center: Penandatangan 2 */}
            <td style={{ width: "33%", verticalAlign: "top", padding: 0, textAlign: "center" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ visibility: "hidden", fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title2}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s2.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s2.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s2.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s2.name}
                </span>
              </div>
            </td>
            {/* Right: Penandatangan 1 (with official header) */}
            <td style={{ width: "34%", verticalAlign: "top", padding: 0, textAlign: "right" }}>
              <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
                <div style={{ fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px", color: "#111827" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
                <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{title1}</div>
                <div style={{ height: "60px" }}></div>
                <span
                  style={{
                    fontSize: "10.5pt",
                    fontWeight: "bold",
                    borderBottom: s1.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: s1.isPlaceholder ? "#94a3b8" : "#111827",
                    fontStyle: s1.isPlaceholder ? "italic" : "normal",
                  }}
                >
                  {s1.name}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // 4. 4 or More Signers Layout (2 columns per row, ordered right-to-left)
  // Row 0: Right = Penandatangan 1, Left = Penandatangan 2
  // Row 1: Right = Penandatangan 3, Left = Penandatangan 4
  const rows = [];
  for (let i = 0; i < signers.length; i += 2) {
    const sRight = signers[i];     // Penandatangan 1, 3, 5... (Right column)
    const sLeft = signers[i + 1];  // Penandatangan 2, 4, 6... (Left column)
    const isFirstRow = i === 0;

    const tRight = formatSignerTitle(sRight.title) || `Penandatangan ${i + 1},`;
    const tLeft = sLeft ? formatSignerTitle(sLeft.title) || `Penandatangan ${i + 2},` : "";

    rows.push(
      <tr key={i}>
        {/* Left Column: Penandatangan i + 2 */}
        <td style={{ width: "48%", verticalAlign: "top", padding: isFirstRow ? 0 : "24px 0 0 0", textAlign: "left" }}>
          {sLeft ? (
            <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
              {isFirstRow && (
                <div style={{ visibility: "hidden", fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px" }}>
                  BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
                </div>
              )}
              <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{tLeft}</div>
              <div style={{ height: "60px" }}></div>
              <span
                style={{
                  fontSize: "10.5pt",
                  fontWeight: "bold",
                  borderBottom: sLeft.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  color: sLeft.isPlaceholder ? "#94a3b8" : "#111827",
                  fontStyle: sLeft.isPlaceholder ? "italic" : "normal",
                }}
              >
                {sLeft.name}
              </span>
            </div>
          ) : null}
        </td>
        {/* Right Column: Penandatangan i + 1 */}
        <td style={{ width: "52%", verticalAlign: "top", padding: isFirstRow ? 0 : "24px 0 0 0", textAlign: "right" }}>
          <div style={{ display: "inline-block", textAlign: "left", fontFamily: "Arial, sans-serif" }}>
            {isFirstRow && (
              <div style={{ fontSize: "9.5pt", fontWeight: "normal", textTransform: "uppercase", lineHeight: 1.25, marginBottom: "6px", color: "#111827" }}>
                BADAN PENGURUS<br />DEWAN SYARIAH NASIONAL-<br />MAJELIS ULAMA INDONESIA
              </div>
            )}
            <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{tRight}</div>
            <div style={{ height: "60px" }}></div>
            <span
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                borderBottom: sRight.isPlaceholder ? "1.5px dashed #94a3b8" : "1.5px solid #000",
                display: "inline-block",
                whiteSpace: "nowrap",
                color: sRight.isPlaceholder ? "#94a3b8" : "#111827",
                fontStyle: sRight.isPlaceholder ? "italic" : "normal",
              }}
            >
              {sRight.name}
            </span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", pageBreakInside: "avoid" }}>
      <tbody>{rows}</tbody>
    </table>
  );
};

export default UniversalSignaturesBlock;
