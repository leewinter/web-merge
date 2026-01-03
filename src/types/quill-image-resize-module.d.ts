declare module 'quill-image-resize-module' {
  import { Quill } from 'quill';

  interface ImageResizeOptions {
    displayStyles?: boolean;
    modules?: string[];
  }

  class ImageResize {
    constructor(quill: Quill, options?: ImageResizeOptions);
  }

  export default ImageResize;
}
