import { fireEvent, render, screen } from '@testing-library/react';
import { ValidatedInput } from '../index';

describe('ValidatedInput', () => {
  it('reports the changed value with its trimmed validity', () => {
    const onChange = jest.fn();

    render(<ValidatedInput placeholder="Name" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: ' Alice ' },
    });

    expect(onChange).toHaveBeenCalledWith(' Alice ', true);
  });
});
