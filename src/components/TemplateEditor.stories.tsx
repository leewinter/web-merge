import type { Meta, StoryObj } from '@storybook/react';
import TemplateEditor, { PlaceholderDefinition } from './TemplateEditor';

const placeholders: PlaceholderDefinition[] = [
  {
    key: 'projectName',
    label: 'Project name',
    description: 'Inserted into the document header and table title.',
    sampleValue: 'Riverfront Demolition'
  },
  {
    key: 'responsiblePerson',
    label: 'Responsible person',
    description: 'Safety contact who signs the form.',
    sampleValue: 'Jordan Brooks'
  },
  {
    key: 'isHighRisk',
    label: 'High-risk activity',
    description: 'Controls shown when the activity is classified as high risk.',
    kind: 'section',
    sectionContent: `{{projectName}} is high risk:
- Isolate the area.
- Notify site leadership.
- Review the RAMS with the team.`,
    sampleValue: true
  }
];

const initialTemplate = `Risk Assessment for {{projectName}}

Prepared by {{responsiblePerson}}.

{{#isHighRisk}}
This activity has been classified as high risk and requires the controls below.
{{/isHighRisk}}
`;

const meta: Meta<typeof TemplateEditor> = {
  title: 'Components/TemplateEditor',
  component: TemplateEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof TemplateEditor>;

export const Default: Story = {
  args: {
    placeholders,
    initialTemplate
  }
};
