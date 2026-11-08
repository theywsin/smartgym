import { Fragment, type ReactNode } from "react";

/**
 * Renders the blog's small Markdown subset as React elements (never raw HTML):
 * ## / ### headings, "- " bullet lists, "> " quotes, blank-line paragraphs, **bold**,
 * [text](https://link) and ![alt](image) on its own line. Only https and /uploads/ URLs are used.
 */
const SAFE_IMG = /^(\/uploads\/[0-9a-f-]{36}\.(png|jpg|webp|gif)|https:\/\/[^\s"'<>()]+)$/;
const SAFE_LINK = /^(https:\/\/[^\s"'<>()]+|\/[A-Za-z0-9/_#?=&.-]*)$/;

function bold(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={`${key}b${i}`}>{part.slice(2, -2)}</strong> : <Fragment key={`${key}t${i}`}>{part}</Fragment>
  );
}
function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)\s]+\))/g).flatMap<ReactNode>((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (m && SAFE_LINK.test(m[2]!)) {
      const external = m[2]!.startsWith("https://");
      return [<a key={`l${i}`} href={m[2]} className="font-semibold text-brand-700 underline underline-offset-4" {...(external && { target: "_blank", rel: "noopener" })}>{bold(m[1]!, `l${i}`)}</a>];
    }
    return bold(part, `p${i}`);
  });
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
    else if (/^!\[[^\]]*\]\([^)\s]+\)$/.test(line.trim())) {
      flushList(); flushPara();
      const [, alt, src] = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line.trim())!;
      // eslint-disable-next-line @next/next/no-img-element -- article images uploaded by admins
      if (SAFE_IMG.test(src!)) blocks.push(<figure key={blocks.length} className="my-6"><img src={src} alt={alt} loading="lazy" className="w-full rounded-2xl" />{alt && <figcaption className="mt-2 text-center text-sm text-ink-3">{alt}</figcaption>}</figure>);
    }
    else if (line.startsWith("> ")) { flushList(); flushPara(); blocks.push(<blockquote key={blocks.length} className="my-5 border-r-4 border-brand-500 bg-brand-50 px-4 py-3 leading-8">{inline(line.slice(2))}</blockquote>); }
    else if (line.trim() === "") { flushList(); flushPara(); }
    else { flushList(); para.push(line.trim()); }
  }
  flushList(); flushPara();
  return <>{blocks}</>;
}
