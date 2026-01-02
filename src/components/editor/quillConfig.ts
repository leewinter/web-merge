import Quill from 'quill';
import TableModule from 'quill/modules/table.js';
import ImageBlot from 'quill/formats/image';

TableModule.register();
Quill.register('formats/image', ImageBlot);

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
      ['image'],
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
  'code',
  'image'
];
