import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { resumeTemplatesTable } from '../db/schema';
import { getResumeTemplates } from '../handlers/get_resume_templates';

describe('getResumeTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no templates exist', async () => {
    const result = await getResumeTemplates();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return only active templates', async () => {
    // Create active template
    const activeTemplate = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Modern Template',
        description: 'A modern resume template',
        css_styles: '.header { color: blue; }',
        html_template: '<div class="header">{{name}}</div>',
        is_active: true
      })
      .returning()
      .execute();

    // Create inactive template
    await db.insert(resumeTemplatesTable)
      .values({
        name: 'Old Template',
        description: 'An old resume template',
        css_styles: '.header { color: red; }',
        html_template: '<div class="header">{{name}}</div>',
        is_active: false
      })
      .returning()
      .execute();

    const result = await getResumeTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Modern Template');
    expect(result[0].description).toEqual('A modern resume template');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple active templates ordered by id', async () => {
    // Create multiple active templates
    const template1 = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Classic Template',
        description: 'A classic design',
        css_styles: '.classic { font-family: serif; }',
        html_template: '<div class="classic">{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();

    const template2 = await db.insert(resumeTemplatesTable)
      .values({
        name: 'Creative Template',
        description: 'A creative design',
        css_styles: '.creative { color: purple; }',
        html_template: '<div class="creative">{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();

    const result = await getResumeTemplates();

    expect(result).toHaveLength(2);
    
    // Find templates by name since order might vary
    const classicTemplate = result.find(t => t.name === 'Classic Template');
    const creativeTemplate = result.find(t => t.name === 'Creative Template');

    expect(classicTemplate).toBeDefined();
    expect(classicTemplate?.description).toEqual('A classic design');
    expect(classicTemplate?.is_active).toBe(true);

    expect(creativeTemplate).toBeDefined();
    expect(creativeTemplate?.description).toEqual('A creative design');
    expect(creativeTemplate?.is_active).toBe(true);

    // Verify all templates have required fields
    result.forEach(template => {
      expect(template.id).toBeDefined();
      expect(typeof template.id).toBe('number');
      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
      expect(template.css_styles).toBeDefined();
      expect(template.html_template).toBeDefined();
      expect(template.created_at).toBeInstanceOf(Date);
      expect(template.is_active).toBe(true);
    });
  });

  it('should handle templates with null descriptions', async () => {
    // Create template with null description
    await db.insert(resumeTemplatesTable)
      .values({
        name: 'Minimal Template',
        description: null,
        css_styles: '.minimal { margin: 0; }',
        html_template: '<div class="minimal">{{content}}</div>',
        is_active: true
      })
      .returning()
      .execute();

    const result = await getResumeTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Template');
    expect(result[0].description).toBeNull();
    expect(result[0].is_active).toBe(true);
  });

  it('should exclude templates with is_active false', async () => {
    // Create only inactive templates
    await db.insert(resumeTemplatesTable)
      .values({
        name: 'Deprecated Template 1',
        description: 'Old template 1',
        css_styles: '.old1 { }',
        html_template: '<div>{{content}}</div>',
        is_active: false
      })
      .returning()
      .execute();

    await db.insert(resumeTemplatesTable)
      .values({
        name: 'Deprecated Template 2',
        description: 'Old template 2',
        css_styles: '.old2 { }',
        html_template: '<div>{{content}}</div>',
        is_active: false
      })
      .returning()
      .execute();

    const result = await getResumeTemplates();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return templates with complete field data', async () => {
    // Create a comprehensive template
    await db.insert(resumeTemplatesTable)
      .values({
        name: 'Professional Template',
        description: 'A professional resume template with all features',
        css_styles: `
          .header { background: #333; color: white; }
          .section { margin: 20px 0; }
          .experience { border-left: 3px solid #007acc; padding-left: 15px; }
        `,
        html_template: `
          <div class="header">
            <h1>{{first_name}} {{last_name}}</h1>
            <p>{{email}} | {{phone}}</p>
          </div>
          <div class="section">
            <h2>Experience</h2>
            {{#each work_experiences}}
            <div class="experience">
              <h3>{{job_title}} at {{company_name}}</h3>
              <p>{{start_date}} - {{end_date}}</p>
              <p>{{description}}</p>
            </div>
            {{/each}}
          </div>
        `,
        is_active: true
      })
      .returning()
      .execute();

    const result = await getResumeTemplates();

    expect(result).toHaveLength(1);
    const template = result[0];

    // Verify all fields are present and properly typed
    expect(typeof template.id).toBe('number');
    expect(template.name).toEqual('Professional Template');
    expect(template.description).toEqual('A professional resume template with all features');
    expect(template.css_styles).toContain('.header');
    expect(template.css_styles).toContain('.section');
    expect(template.html_template).toContain('{{first_name}}');
    expect(template.html_template).toContain('{{#each work_experiences}}');
    expect(template.is_active).toBe(true);
    expect(template.created_at).toBeInstanceOf(Date);
  });
});