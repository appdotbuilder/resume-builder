import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { resumeTemplatesTable } from '../db/schema';
import { type CreateResumeTemplateInput } from '../schema';
import { createResumeTemplate } from '../handlers/create_resume_template';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateResumeTemplateInput = {
  name: 'Modern Professional',
  description: 'A clean, modern resume template for professionals',
  css_styles: '.resume { font-family: Arial, sans-serif; }',
  html_template: '<div class="resume">{{content}}</div>',
  is_active: true
};

// Minimal test input (testing defaults)
const minimalInput: CreateResumeTemplateInput = {
  name: 'Basic Template',
  description: null,
  css_styles: 'body { margin: 0; }',
  html_template: '<html><body>{{content}}</body></html>'
  // is_active omitted to test default value
};

describe('createResumeTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a resume template with all fields', async () => {
    const result = await createResumeTemplate(testInput);

    // Basic field validation
    expect(result.name).toEqual('Modern Professional');
    expect(result.description).toEqual('A clean, modern resume template for professionals');
    expect(result.css_styles).toEqual('.resume { font-family: Arial, sans-serif; }');
    expect(result.html_template).toEqual('<div class="resume">{{content}}</div>');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a resume template with minimal fields and proper defaults', async () => {
    const result = await createResumeTemplate(minimalInput);

    expect(result.name).toEqual('Basic Template');
    expect(result.description).toEqual(null);
    expect(result.css_styles).toEqual('body { margin: 0; }');
    expect(result.html_template).toEqual('<html><body>{{content}}</body></html>');
    expect(result.is_active).toEqual(true); // Should default to true
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save resume template to database correctly', async () => {
    const result = await createResumeTemplate(testInput);

    // Query using proper drizzle syntax
    const templates = await db.select()
      .from(resumeTemplatesTable)
      .where(eq(resumeTemplatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual('Modern Professional');
    expect(templates[0].description).toEqual('A clean, modern resume template for professionals');
    expect(templates[0].css_styles).toEqual('.resume { font-family: Arial, sans-serif; }');
    expect(templates[0].html_template).toEqual('<div class="resume">{{content}}</div>');
    expect(templates[0].is_active).toEqual(true);
    expect(templates[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle explicit is_active false value', async () => {
    const inactiveTemplateInput: CreateResumeTemplateInput = {
      ...testInput,
      is_active: false
    };

    const result = await createResumeTemplate(inactiveTemplateInput);

    expect(result.is_active).toEqual(false);

    // Verify in database
    const templates = await db.select()
      .from(resumeTemplatesTable)
      .where(eq(resumeTemplatesTable.id, result.id))
      .execute();

    expect(templates[0].is_active).toEqual(false);
  });

  it('should handle null description correctly', async () => {
    const nullDescriptionInput: CreateResumeTemplateInput = {
      ...testInput,
      description: null
    };

    const result = await createResumeTemplate(nullDescriptionInput);

    expect(result.description).toEqual(null);

    // Verify in database
    const templates = await db.select()
      .from(resumeTemplatesTable)
      .where(eq(resumeTemplatesTable.id, result.id))
      .execute();

    expect(templates[0].description).toEqual(null);
  });

  it('should generate unique IDs for multiple templates', async () => {
    const result1 = await createResumeTemplate({
      ...testInput,
      name: 'Template 1'
    });

    const result2 = await createResumeTemplate({
      ...testInput,
      name: 'Template 2'
    });

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const templates = await db.select()
      .from(resumeTemplatesTable)
      .execute();

    expect(templates).toHaveLength(2);
    expect(templates.map(t => t.name)).toContain('Template 1');
    expect(templates.map(t => t.name)).toContain('Template 2');
  });

  it('should handle complex CSS and HTML content', async () => {
    const complexInput: CreateResumeTemplateInput = {
      name: 'Complex Template',
      description: 'Template with complex styling and structure',
      css_styles: `
        .resume {
          max-width: 800px;
          margin: 0 auto;
          font-family: 'Georgia', serif;
        }
        .header { color: #333; border-bottom: 2px solid #000; }
        @media print { .resume { font-size: 12px; } }
      `,
      html_template: `
        <div class="resume">
          <div class="header">
            <h1>{{name}}</h1>
            <p>{{email}} | {{phone}}</p>
          </div>
          <div class="content">
            {{work_experience}}
            {{education}}
          </div>
        </div>
      `,
      is_active: true
    };

    const result = await createResumeTemplate(complexInput);

    expect(result.css_styles).toContain('max-width: 800px');
    expect(result.css_styles).toContain('@media print');
    expect(result.html_template).toContain('{{name}}');
    expect(result.html_template).toContain('{{work_experience}}');

    // Verify complex content is preserved in database
    const templates = await db.select()
      .from(resumeTemplatesTable)
      .where(eq(resumeTemplatesTable.id, result.id))
      .execute();

    expect(templates[0].css_styles).toEqual(complexInput.css_styles);
    expect(templates[0].html_template).toEqual(complexInput.html_template);
  });
});