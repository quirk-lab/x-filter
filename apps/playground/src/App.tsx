import { Fragment } from 'react';
import { scenarios } from './demos/scenarios';

const App = () => (
  <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
    <header style={{ marginBottom: '2rem' }}>
      <h1>X-Filter Playground</h1>
      <p>
        Explore headless query builder scenarios. Use the controls exposed by each demo to validate
        core logic, formatter integration, and playground wiring.
      </p>
    </header>

    {scenarios.map(({ id, title, description, element: Element }) => (
      <section key={id} style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        <h2>{title}</h2>
        <p>{description}</p>
        <Element />
      </section>
    ))}
  </main>
);

export default App;
