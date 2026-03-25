import { ChangeEvent, useId, useState } from 'react';

import { Button } from '@/components/common/Button';

const MAX_FILE_SIZE_BYTES = 2_500_000;

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No pudimos leer la imagen elegida.'));
    reader.readAsDataURL(file);
  });
}

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  previewLabel?: string;
}

export function ImagePickerField({
  label,
  value,
  onChange,
  hint,
  previewLabel = 'Vista previa de imagen',
}: ImagePickerFieldProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Elegí un archivo de imagen válido.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('La imagen supera el límite de 2.5 MB.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
      setError(null);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'No pudimos cargar la imagen.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="field image-picker">
      <span className="field__label">{label}</span>

      {value ? (
        <div className="image-picker__preview">
          <img src={value} alt={previewLabel} />
        </div>
      ) : (
        <div className="image-picker__placeholder">
          Elegí una imagen desde tu dispositivo o pegá una URL.
        </div>
      )}

      <div className="image-picker__actions">
        <label className="button button--secondary" htmlFor={inputId}>
          Explorar dispositivo
        </label>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {value ? (
          <Button type="button" variant="ghost" onClick={() => onChange('')}>
            Quitar imagen
          </Button>
        ) : null}
      </div>

      <input
        className="field__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://... o imagen subida"
      />

      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
}
