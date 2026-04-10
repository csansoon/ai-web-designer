import '@testing-library/jest-dom';

jest.mock('@shoelace-style/shoelace/dist/react', () => {
  const React = require('react');

  const passthrough = (tagName, defaultProps = {}) => {
    return React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(tagName, { ref, ...defaultProps, ...props }, children),
    );
  };

  return {
    SlButton: passthrough('button'),
    SlDialog: passthrough('div'),
    SlInput: passthrough('input'),
    SlSelect: passthrough('select'),
    SlOption: passthrough('option'),
    SlTooltip: passthrough('div'),
    SlIcon: passthrough('span'),
    SlBadge: passthrough('span'),
    SlSpinner: passthrough('div'),
  };
});
