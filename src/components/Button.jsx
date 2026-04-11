/**
 * Button — reusable button with variant, size, loading, and icon support.
 *
 * Props:
 *   variant     ('primary'|'secondary'|'ghost')
 *   size        ('sm'|'md'|'lg')
 *   loading     (bool)   — shows spinner and disables clicks
 *   fullWidth   (bool)   — stretches to 100% width
 *   leftIcon    (node)   — icon before label
 *   rightIcon   (node)   — icon after label
 *   children    (node)   — button text
 *   className   (string) — extra classes
 *   ...rest              — forwarded to <button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...rest
}) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      disabled={loading || rest.disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full justify-center' : ''}
        inline-flex items-center gap-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon && <span aria-hidden="true">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  )
}
