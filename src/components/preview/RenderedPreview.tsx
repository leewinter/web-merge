import React from 'react';

const previewListStyles = `
  .rendered-preview ol[data-list='bullet'] {
    list-style-type: disc;
    list-style-position: outside;
    margin-left: 1.3rem;
  }
  .rendered-preview li[data-list='bullet'] {
    list-style-type: disc;
  }
  .rendered-preview ol[data-list='ordered'] {
    list-style-type: decimal;
    list-style-position: outside;
    margin-left: 1.3rem;
  }
  .rendered-preview li[data-list='ordered'] {
    list-style-type: decimal;
  }
  .rendered-preview li {
    counter-reset: none;
  }
`;

interface RenderedPreviewProps {
  renderedResult: { html: string; isError: boolean };
}

export const RenderedPreview: React.FC<RenderedPreviewProps> = ({ renderedResult }) => (
  <div
    className="rendered-preview"
    style={{
      minHeight: 80,
      padding: 12,
      borderRadius: 4,
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}
  >
    <style>{previewListStyles}</style>
    {renderedResult.isError ? (
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{renderedResult.html}</pre>
    ) : (
      <div dangerouslySetInnerHTML={{ __html: renderedResult.html }} style={{ whiteSpace: 'pre-wrap' }} />
    )}
  </div>
);
