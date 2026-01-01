export type PlaceholderKind = 'value' | 'section';

export interface PlaceholderDefinition {
  key: string;
  label: string;
  description?: string;
  sampleValue?: string | boolean | number;
  allowSection?: boolean;
  kind?: PlaceholderKind;
  sectionContent?: string;
}

export interface TemplateEditorProps {
  initialTemplate?: string;
  initialValues?: Record<string, unknown>;
  placeholders: PlaceholderDefinition[];
  onTemplateChange?: (template: string) => void;
  onValuesChange?: (values: Record<string, unknown>) => void;
}

export interface SectionInfo {
  id: string;
  key: string;
  label: string;
  content: string;
  pos: number;
}

export interface PlaceholderRenderInfo extends PlaceholderDefinition {
  mode: PlaceholderKind;
  supportsSection: boolean;
}
