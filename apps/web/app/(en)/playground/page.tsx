import { PlaygroundWorkbench } from '../../../src/components/demos/playground-workbench';

export const metadata = {
  title: 'Playground',
  description:
    'Real-world filter demos — Notion-style database filters, GitHub-style search bar, and adapter workbench.',
};

export default function Page() {
  return (
    <section className="page-section">
      <div className="content-shell">
        <div className="prose" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">Interactive demos</p>
          <h1>Playground</h1>
          <p className="lede">
            Explore real-world filter UIs built with X-Filter — a Notion-style database filter, a
            GitHub-style tokenized search bar, and an adapter comparison workbench.
          </p>
        </div>
        <PlaygroundWorkbench locale="en" />
      </div>
    </section>
  );
}
