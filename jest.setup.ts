import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// jsdom does not implement scrollIntoView — Radix UI components call it.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
