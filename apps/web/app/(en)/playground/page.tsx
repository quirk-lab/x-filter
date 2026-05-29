import { PlaygroundWorkbench } from '../../../src/components/demos/playground-workbench';

export const metadata = {
  title: 'Playground',
  description: 'Compare X-Filter adapters and inspect JSON, DSL, SQL, and validation output.',
};

export default function Page() {
  return (
    <section className="page-section">
      <div className="content-shell">
        <div className="prose" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">Interactive demo</p>
          <h1>Playground</h1>
          <p className="lede">
            Switch adapters, mutate a filter, load nested and invalid examples, and inspect every
            generated output without a backend.
          </p>
        </div>
        <PlaygroundWorkbench locale="en" />
      </div>
    </section>
  );
}
