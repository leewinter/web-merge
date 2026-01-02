import type { PlaceholderDefinition, PlaceholderKind, SectionInfo } from '../template-types';

const SECTION_WRAPPER_STYLE =
  'background:#fefce8;color:#92400e;border-radius:4px;padding:2px 6px;border:1px solid #fcd34d;display:inline-flex;';

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const generateSectionId = (() => {
  let id = 1;
  return () => `section-${id++}`;
})();

export const placeholderSupportsSection = (placeholder: PlaceholderDefinition) =>
  placeholder.allowSection ?? (Boolean(placeholder.sectionContent) || placeholder.kind === 'section');

export const buildInitialValues = (
  placeholders: PlaceholderDefinition[],
  overrides: Record<string, unknown> | undefined
) =>
  placeholders.reduce<Record<string, unknown>>((acc, placeholder) => {
    const fallback =
      overrides?.[placeholder.key] ?? placeholder.sampleValue ?? (placeholder.kind === 'section' ? true : '');
    acc[placeholder.key] = fallback;
    return acc;
  }, {});

export const buildInitialModes = (placeholders: PlaceholderDefinition[]) =>
  placeholders.reduce<Record<string, PlaceholderKind>>((acc, placeholder) => {
    acc[placeholder.key] = placeholder.kind ?? 'value';
    return acc;
  }, {});

export const formatSectionToken = (placeholder: PlaceholderDefinition, override?: string) => {
  const content = (override ?? placeholder.sectionContent ?? 'Conditional content here.').trim();
  return `{{#${placeholder.key}}}${content}{{/${placeholder.key}}}`;
};

export const wrapSections = (template: string, placeholders: PlaceholderDefinition[]) => {
  const placeholderMap = placeholders.reduce<Record<string, string>>((map, placeholder) => {
    map[placeholder.key] = placeholder.label;
    return map;
  }, {});
  return template.replace(/{{#([a-zA-Z0-9_]+)}}([\s\S]*?){{\/\1}}/g, (match, key) => {
    if (!placeholderMap[key]) {
      return match;
    }
    const label = placeholderMap[key];
    return `<span data-section="${key}" data-label="${label}" data-section-id="${generateSectionId()}" data-content="${escapeAttribute(
      match
    )}" class="template-section" style="${SECTION_WRAPPER_STYLE}">${match}</span>`;
  });
};

const parsePlaceholderToken = (
  match: string,
  key: string,
  placeholderKeys: string[],
  placeholderMap: Record<string, string>
) => {
  if (!placeholderKeys.includes(key)) {
    return match;
  }

  const label = placeholderMap[key] ?? key;
  return `<span data-placeholder="${key}" data-label="${label}" class="template-placeholder">${match}</span>`;
};

export const templateToEditorContent = (template: string, placeholders: PlaceholderDefinition[]) => {
  if (!template) {
    return '';
  }

  const placeholderMap = placeholders.reduce<Record<string, string>>((map, placeholder) => {
    map[placeholder.key] = placeholder.label;
    return map;
  }, {});
  const withSections = wrapSections(template, placeholders);
  const keys = placeholders.map((p) => p.key);
  return withSections.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) =>
    parsePlaceholderToken(match, key, keys, placeholderMap)
  );
};

export const stripHighlightSpans = (html: string) => {
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html.replace(/<span[^>]+class="template-(placeholder|section)"[^>]*>/g, '').replace(/<\/span>/g, '');
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc
    .querySelectorAll('.template-placeholder, .template-section')
    .forEach((element) => {
      const fragment = document.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
    });
  return doc.body.innerHTML;
};

export const collectSectionsFromHtml = (html: string): SectionInfo[] => {
  if (typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections: SectionInfo[] = [];
  doc.querySelectorAll('span[data-section-id]').forEach((element, index) => {
    sections.push({
      id: element.getAttribute('data-section-id') ?? `section-${index}`,
      key: element.getAttribute('data-section') ?? '',
      label: element.getAttribute('data-label') ?? '',
      content: element.getAttribute('data-content') ?? element.textContent ?? '',
      pos: index
    });
  });
  return sections;
};
