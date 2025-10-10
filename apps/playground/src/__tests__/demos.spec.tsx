import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from '../App';

describe('playground demos', () => {
  it('allows adding rules in the basic scenario', () => {
    render(<App />);

    const addButton = screen.getByText('Add Status Rule');
    fireEvent.click(addButton);

    expect(screen.getByTestId('rule-list').textContent).toContain('status equals');
  });

  it('passes accessibility checks for rendered scenarios', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
