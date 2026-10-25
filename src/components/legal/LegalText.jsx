import React from "react";

// A legal text in its simple format: "## " starts a heading, "- " a list item, an empty line a new paragraph
export default function LegalText({ body }) {
    const blocks = (body || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).map(block => block.split("\n").filter(line => line.trim() !== ""));
    return (
        <div className="legal-text">
            {blocks.map((lines, index) => {
                const parts = [];
                let list = [];
                const flushList = () => {
                    if (list.length) parts.push(<ul key={`ul${parts.length}`}>{list.map((item, i) => <li key={i}>{item}</li>)}</ul>);
                    list = [];
                };
                lines.forEach(line => {
                    if (line.startsWith("- ")) {
                        list.push(line.slice(2));
                    } else if (line.startsWith("## ")) {
                        flushList();
                        parts.push(<h3 key={`h${parts.length}`}>{line.slice(3)}</h3>);
                    } else {
                        flushList();
                        parts.push(<p key={`p${parts.length}`}>{line}</p>);
                    }
                });
                flushList();
                return <React.Fragment key={index}>{parts}</React.Fragment>;
            })}
        </div>
    );
}
