import React from 'react';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual intent for the button.
   */
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: '#2563eb', color: '#ffffff' },
  secondary: { backgroundColor: '#e5e7eb', color: '#111827' }
};

const baseStyle: React.CSSProperties = {
  border: 'none',
  padding: '0.6rem 1.15rem',
  fontSize: '1rem',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', style, className, ...rest },
  ref
) {
  const mergedStyle = { ...baseStyle, ...variantStyles[variant], ...style };

  return (
    <button
      ref={ref}
      className={className}
      style={mergedStyle}
      type="button"
      {...rest}
    />
  );
});

Button.displayName = 'Button';

export default Button;
