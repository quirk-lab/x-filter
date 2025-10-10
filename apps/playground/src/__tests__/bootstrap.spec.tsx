import { render, screen } from '@testing-library/react';
import App from '../App';
import { scenarios } from '../demos/scenarios';

describe('playground bootstrap', () => {
  it('exposes at least five independent scenarios', () => {
    expect(scenarios).toHaveLength(5);
  });

  it('renders the app shell with scenario titles', () => {
    render(<App />);

    scenarios.forEach((scenario) => {
      expect(screen.getByText(scenario.title)).toBeInTheDocument();
    });
  });
});
