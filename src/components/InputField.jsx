import { forwardRef } from 'react'

/**
 * InputField — reusable controlled input with label, icon, and error state.
 *
 * Props:
 *   id          (string)  — unique html id, required
 *   label       (string)  — visible label text
 *   icon        (node)    — optional lucide icon element
 *   error       (string)  — validation error message
 *   light       (bool)    — use light variant (for white card backgrounds)
 *   className   (string)  — extra classes for the wrapper
 *   ...rest               — forwarded to <input>
 */
const InputField = forwardRef(function InputField(
  { id, label, icon, error, light = false, className = '', ...rest },
  ref
) {
  const inputClass = light ? 'input-field-light' : 'input-field'
  const labelClass = light ? 'text-slate-700' : 'text-slate-300'
  const iconClass = light ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-medium ${labelClass}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass} pointer-events-none`}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`${inputClass} ${icon ? 'pl-10' : ''} ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-red-400 text-xs mt-0.5 flex items-center gap-1"
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
})

export default InputField
