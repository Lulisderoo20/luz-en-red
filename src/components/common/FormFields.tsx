import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, hint, children }: FieldWrapperProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function InputField({ label, error, hint, className = '', ...props }: InputFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input className={`field__control ${className}`.trim()} {...props} />
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function TextareaField({
  label,
  error,
  hint,
  className = '',
  ...props
}: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea className={`field__control field__control--textarea ${className}`.trim()} {...props} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function SelectField({
  label,
  error,
  hint,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <select className={`field__control ${className}`.trim()} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}
