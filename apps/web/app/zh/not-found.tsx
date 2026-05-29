import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-section page-section--compact">
      <div className="content-shell prose">
        <p className="eyebrow">404</p>
        <h1>页面不存在</h1>
        <p>这个页面可能已经移动。你可以从文档概览或演练场继续。</p>
        <p>
          <Link href="/zh/docs">文档</Link> · <Link href="/zh/playground">演练场</Link>
        </p>
      </div>
    </section>
  );
}
