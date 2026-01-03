import React from 'react';

  const previewStyles = `
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
    .rendered-preview table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5f5;
      margin: 12px 0;
    }
    .rendered-preview td,
    .rendered-preview th {
      border: 1px solid #cbd5f5;
      padding: 8px;
    }
    .rendered-preview td[data-row^='row-'] {
      border: 1px solid #cbd5f5;
    }
    .rendered-preview .ql-align-center {
      text-align: center;
    }
    .rendered-preview .ql-align-right {
      text-align: right;
    }
    .rendered-preview .ql-align-justify {
      text-align: justify;
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
    <style>{previewStyles}</style>
    {renderedResult.isError ? (
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{renderedResult.html}</pre>
    ) : (
      <div dangerouslySetInnerHTML={{ __html: renderedResult.html }} style={{ whiteSpace: 'pre-wrap' }} />
    )}
  </div>
);
