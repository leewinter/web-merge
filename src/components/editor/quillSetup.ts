import Quill from 'quill';
import * as ParchmentModule from 'parchment';

if (typeof window !== 'undefined') {
  const win = window as Window & { Quill?: typeof Quill };
  win.Quill = Quill;
  const quillImports = (Quill as typeof Quill & { imports?: Record<string, any> }).imports ?? {};
  (Quill as typeof Quill & { imports?: Record<string, any> }).imports = quillImports;

  const normalizedParchment = (ParchmentModule as typeof ParchmentModule & { default?: typeof ParchmentModule }).default ?? ParchmentModule;
  const normalizedAttributor = normalizedParchment.Attributor ?? {};
  const patchedAttributor = {
    Attribute: normalizedAttributor.Attribute,
    Class: normalizedAttributor.Class,
    Style: normalizedAttributor.Style,
    Store: normalizedAttributor.Store
  };
  if (quillImports.parchment) {
    const existing = quillImports.parchment;
    const mergedAttributor = {
      ...normalizedAttributor,
      ...existing.Attributor,
      Style: existing.Attributor?.Style ?? normalizedAttributor.Style
    };
    const patched = { ...existing, Attributor: mergedAttributor };
    Object.defineProperty(quillImports, 'parchment', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: patched
    });
  } else {
    Object.defineProperty(quillImports, 'parchment', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { ...normalizedParchment, Attributor: patchedAttributor }
    });
  }
}

export default Quill;
