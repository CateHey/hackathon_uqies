import type { ReactNode } from "react";

/**
 * A deliberately tiny Markdown renderer for lesson bodies: headings, paragraphs,
 * bullet/numbered lists, bold, italics and inline code. No raw HTML is ever rendered.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-4 text-parchment/90">
      {blocks.map((block, i) => (
        <Block key={i} block={block.trim()} />
      ))}
    </div>
  );
}

function Block({ block }: { block: string }) {
  if (!block) return null;
  const lines = block.split("\n");
  const first = lines[0] ?? "";
  if (/^#{1,3}\s/.test(first) && lines.length === 1) {
    const level = first.match(/^(#{1,3})/)![1]!.length;
    const content = inline(first.replace(/^#{1,3}\s+/, ""));
    if (level === 1) return <h1 className="font-display text-3xl text-parchment">{content}</h1>;
    if (level === 2) return <h2 className="font-display text-2xl text-parchment">{content}</h2>;
    return <h3 className="font-display text-xl text-parchment">{content}</h3>;
  }
  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
    return (
      <ol className="list-decimal space-y-1 pl-5">
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
        ))}
      </ol>
    );
  }
  if (/^>\s?/.test(first)) {
    return <blockquote className="border-l-2 border-gold/60 pl-4 italic text-parchment/80">{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</blockquote>;
  }
  return <p className="leading-relaxed">{inline(lines.join(" "))}</p>;
}

/** **bold**, *italic*, `code` */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) out.push(<strong key={key++} className="text-parchment">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) out.push(<code key={key++} className="rounded bg-white/10 px-1 text-sm">{token.slice(1, -1)}</code>);
    else out.push(<em key={key++}>{token.slice(1, -1)}</em>);
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
