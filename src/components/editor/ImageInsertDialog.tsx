import React from 'react';

interface ImageInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string) => void;
  readFileAsDataUrl: (file: File) => Promise<string>;
}

export const ImageInsertDialog: React.FC<ImageInsertDialogProps> = ({
  open,
  onClose,
  onInsert,
  readFileAsDataUrl
}) => {
  const [url, setUrl] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setUrl('');
      setIsUploading(false);
    }
  }, [open]);

  const hasUrl = url.trim().length > 0;

  const handleUrlSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }
    onInsert(trimmed);
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onInsert(dataUrl);
      onClose();
    } catch (error) {
      console.error('Unable to read image', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="image-dialog-overlay" role="dialog" aria-modal="true">
      <div className="image-dialog-card">
        <h4>Insert image</h4>
        <p>Paste a public URL or upload a file to embed in the template.</p>
        <label className="image-dialog-label">
          Image URL
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </label>
        <div className="image-dialog-actions">
          <button type="button" onClick={handleUrlSubmit} disabled={!url.trim()}>
            Insert URL
          </button>
          <label className="image-dialog-upload" data-disabled={hasUrl || isUploading ? 'true' : 'false'}>
            {isUploading ? 'Uploading…' : 'Upload file'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || hasUrl}
            />
          </label>
        </div>
        <div className="image-dialog-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
