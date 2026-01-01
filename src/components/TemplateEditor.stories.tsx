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
    kind: 'section',
    sectionContent: `Content goes here`,
    sampleValue: 'Jordan Brooks'
  },
  {
    key: 'isHighRisk',
    label: 'High-risk activity',
    description: 'Controls shown when the activity is classified as high risk.',
    kind: 'section',
    sectionContent: `Content goes here`,
    sampleValue: true
  }
];

const initialTemplate = `
<p>Risk Assessment for {{projectName}}</p>

<p>Prepared by {{responsiblePerson}}.</p>

<table>
  <thead>
    <tr>
      <th>Control</th>
      <th>Owner</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Engage the team</td>
      <td>{{responsiblePerson}}</td>
    </tr>
  </tbody>
</table>

{{#isHighRisk}}
<p>This activity has been classified as high risk and requires the controls below.</p>
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
