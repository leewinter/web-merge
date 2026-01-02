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
    sectionContent: `Content goes here`,
    sampleValue: true
  },
];

const initialTemplate = `
<h1 style="color:#020617">Risk Assessment</h1>
<p style="font-size:18px; color:#0f172a;">Project: <strong style="color:#f97316;">{{projectName}}</strong></p>
<p>
  Prepared by <span style="font-weight:700;">{{responsiblePerson}}</span>
  <span style="background:#a7f3d0; color:#064e3b; padding:2px 6px; border-radius:4px;">Lead Safety</span>
</p>

<h2 style="margin-top:32px; color:#0ea5e9;">Overview</h2>
<p style="color:#475569;">
  Use the checklist below to verify that every section of the template is complete prior to export.
</p>

<ol>
  <li>Confirm the introduction text and title are accurate.</li>
  <li>Update the table controls for equipment owners.</li>
  <li>Review the lists for new hazards discovered on site.</li>
</ol>

<h3 style="margin-top:24px;color:#0f172a;">Key controls</h3>
<table style="border:1px solid #cbd5f5; border-radius:4px; width:100%; border-collapse:collapse;">
  <tbody>
    <tr>
      <td data-row="row-a6y2" style="padding:8px; background:#e0f2fe; color:#0f172a;">Control</td>
      <td data-row="row-a6y2" style="padding:8px; background:#e0f2fe; color:#0f172a;">Owner</td>
    </tr>
    <tr>
      <td data-row="row-ln4p" style="padding:8px; border-top:1px solid #cbd5f5;">Engage the team</td>
      <td data-row="row-ln4p" style="padding:8px; border-top:1px solid #cbd5f5;">{{responsiblePerson}}</td>
    </tr>
    <tr>
      <td data-row="row-fa4m" style="padding:8px; border-top:1px solid #cbd5f5;">Inspect access routes</td>
      <td data-row="row-fa4m" style="padding:8px; border-top:1px solid #cbd5f5;">Lead supervisor</td>
    </tr>
  </tbody>
</table>

<p style="margin-top:24px; font-size:16px;">
  This document highlights the core hazards and <strong>must</strong> be signed off before work starts.
</p>

<ul>
  <li style="color:#0f172a;">Describe any coloured-section hazards clearly.</li>
  <li style="color:#0f172a;">Document the owner for each control.</li>
  <li style="color:#0f172a;">Associate the placeholders with data sources so previews stay accurate.</li>
</ul>

{{#isHighRisk}}
<div style="margin-top:32px; border-radius:8px; padding:16px; background:#fde68a;">
  <h3 style="margin:0 0 12px 0; color:#92400e;">High-risk activity</h3>
  <p style="margin:0 0 12px 0;">This activity has been classified as high risk and requires the controls below.</p>
  <ul style="margin:0 0 0 16px;">
    <li>Confirm PPE is worn at all times.</li>
    <li>Brief the crew on escape routes.</li>
    <li>Coordinate communications before lifting.</li>
  </ul>
</div>
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
