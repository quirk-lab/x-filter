import { render, screen } from '@testing-library/react';
import { FilteredList } from '../index';

describe('FilteredList', () => {
  it('renders only non-nullish items', () => {
    render(
      <FilteredList
        items={[1, null, 2, undefined, 3]}
        renderItem={(item) => <span>Item {item}</span>}
      />
    );

    expect(screen.getByText('Item 1')).not.toBeNull();
    expect(screen.getByText('Item 2')).not.toBeNull();
    expect(screen.getByText('Item 3')).not.toBeNull();
    expect(screen.queryAllByText(/Item/)).toHaveLength(3);
  });
});
