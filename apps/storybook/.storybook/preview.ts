import 'antd/dist/reset.css';
import type { Preview } from '@storybook/react';
import { createElement } from 'react';

const preview: Preview = {
  decorators: [
    (Story) =>
      createElement(
        'div',
        {
          style: {
            minHeight: '100vh',
            background: '#f8fafc',
            color: '#0f172a',
          },
        },
        createElement(Story)
      ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
