import TableModule from 'quill/modules/table.js';

TableModule.register();

export const quillModules = {
  toolbar: {
    container: [
      [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'code'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  },
  clipboard: {
    matchVisual: false
  },
  table: true
};

export const quillFormats = [
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'header',
  'code-block',
  'table',
  'font',
  'size',
  'color',
  'background',
  'script',
  'align',
  'indent',
  'code'
];
