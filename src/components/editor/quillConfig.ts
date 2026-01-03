import Quill from './quillSetup';
import TableModule from 'quill/modules/table.js';
import ImageResize from 'quill-image-resize-module';

TableModule.register();
Quill.register('modules/imageResize', ImageResize);

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
  imageResize: {
    displayStyles: true,
    modules: ['Resize', 'DisplaySize', 'Toolbar']
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
