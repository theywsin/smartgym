import { Fragment, type ReactNode } from "react";

/**
 * Renders the blog's small Markdown subset as React elements (never raw HTML):
 * ## / ### headings, "- " bullet lists, blank-line paragraphs, **bold**.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

export function headingsOf(md: string) {
  return md.split("\n").filter((l) => l.startsWith("## ")).map((l, i) => ({ id: `s${i + 1}`, text: l.slice(3).trim() }));
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let h2 = 0;
  const flushList = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="my-4 list-disc space-y-2 pr-6">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  const flushPara = () => { if (para.length) { blocks.push(<p key={blocks.length} className="my-4 leading-8">{inline(para.join(" "))}</p>); para = []; } };
  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) { flushList(); flushPara(); h2++; blocks.push(<h2 key={blocks.length} id={`s${h2}`} className="mt-10 mb-3 scroll-mt-24 text-2xl font-extrabold">{line.slice(3)}</h2>); }
    else if (line.startsWith("### ")) { flushList(); flushPara(); blocks.push(<h3 key={blocks.length} className="mt-6 mb-2 text-lg font-bold">{line.slice(4)}</h3>); }
    else if (line.startsWith("- ")) { flushPara(); list.push(line.slice(2)); }
    else if (line.trim() === "") { flushList(); flushPara(); }
    else { flushList(); para.push(line.trim()); }
  }
  flushList(); flushPara();
  return <>{blocks}</>;
}
