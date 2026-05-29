import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-section page-section--compact">
      <div className="content-shell prose">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>
          The page may have moved. Start from the documentation overview or open the playground.
        </p>
        <p>
          <Link href="/docs">Documentation</Link> · <Link href="/playground">Playground</Link>
        </p>
      </div>
    </section>
  );
}
