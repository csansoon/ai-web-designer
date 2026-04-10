import '@testing-library/jest-dom';

jest.mock('@shoelace-style/shoelace/dist/react', () => {
  const React = require('react');

  const passthrough = (tagName, defaultProps = {}) => {
    return React.forwardRef(({ children, onSlInput, onSlChange, onSlRequestClose, loading, hoist, circle, ...props }, ref) => {
      const normalizedProps = {
        ref,
        ...defaultProps,
        ...props,
      };

      if (onSlInput) {
        normalizedProps.onInput = onSlInput;
        normalizedProps.onChange = onSlInput;
      }

      if (onSlChange) {
        normalizedProps.onChange = onSlChange;
      }

      if (tagName === 'input' || tagName === 'select') {
        normalizedProps.readOnly = normalizedProps.onChange ? undefined : true;
      }

      return React.createElement(tagName, normalizedProps, children);
    });
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
