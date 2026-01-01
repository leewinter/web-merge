import React from 'react';

interface RenderedPreviewProps {
  renderedResult: { html: string; isError: boolean };
}

export const RenderedPreview: React.FC<RenderedPreviewProps> = ({ renderedResult }) => (
  <div
    style={{
      minHeight: 80,
      padding: 12,
      borderRadius: 4,
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}
  >
    {renderedResult.isError ? (
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{renderedResult.html}</pre>
    ) : (
      <div dangerouslySetInnerHTML={{ __html: renderedResult.html }} style={{ whiteSpace: 'pre-wrap' }} />
    )}
  </div>
);
