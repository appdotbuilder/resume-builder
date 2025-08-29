import { db } from '../db';
import { resumesTable, workExperiencesTable, educationTable, skillsTable, resumeTemplatesTable, usersTable } from '../db/schema';
import { type GetResumeByIdInput } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function generateResumePDF(input: GetResumeByIdInput): Promise<Buffer> {
  try {
    // Fetch the resume with user and template data
    const resumeResults = await db.select()
      .from(resumesTable)
      .innerJoin(usersTable, eq(resumesTable.user_id, usersTable.id))
      .leftJoin(resumeTemplatesTable, eq(resumesTable.template_id, resumeTemplatesTable.id))
      .where(eq(resumesTable.id, input.id))
      .execute();

    if (resumeResults.length === 0) {
      throw new Error(`Resume with id ${input.id} not found`);
    }

    const resumeData = resumeResults[0];
    const resume = resumeData.resumes;
    const user = resumeData.users;
    const template = resumeData.resume_templates;

    // Fetch work experiences ordered by order_index
    const workExperiences = await db.select()
      .from(workExperiencesTable)
      .where(eq(workExperiencesTable.resume_id, input.id))
      .orderBy(asc(workExperiencesTable.order_index))
      .execute();

    // Fetch education ordered by order_index
    const education = await db.select()
      .from(educationTable)
      .where(eq(educationTable.resume_id, input.id))
      .orderBy(asc(educationTable.order_index))
      .execute();

    // Fetch skills ordered by order_index
    const skills = await db.select()
      .from(skillsTable)
      .where(eq(skillsTable.resume_id, input.id))
      .orderBy(asc(skillsTable.order_index))
      .execute();

    // Prepare data for PDF generation
    const pdfData = {
      resume: {
        ...resume,
        user: {
          ...user,
        },
        template: template ? {
          ...template,
        } : null,
        workExperiences: workExperiences,
        education: education.map(edu => ({
          ...edu,
          gpa: edu.gpa ? parseFloat(edu.gpa.toString()) : null, // Convert numeric gpa field
        })),
        skills: skills,
      }
    };

    // Generate HTML from template
    let htmlContent = template?.html_template || `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
            .experience-item, .education-item { margin-bottom: 15px; }
            .item-header { font-weight: bold; }
            .item-details { color: #666; font-size: 14px; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
            .skill-item { background: #f0f0f0; padding: 5px 10px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{{user.first_name}} {{user.last_name}}</h1>
            <p>{{user.email}} | {{user.phone}}</p>
            <p>{{user.address}}, {{user.city}}, {{user.state}} {{user.zip_code}}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">{{resume.title}}</h2>
            <p>{{resume.summary}}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Work Experience</h2>
            {{#each workExperiences}}
            <div class="experience-item">
              <div class="item-header">{{job_title}} at {{company_name}}</div>
              <div class="item-details">{{location}} | {{start_date}} - {{#if is_current}}Present{{else}}{{end_date}}{{/if}}</div>
              <p>{{description}}</p>
            </div>
            {{/each}}
          </div>
          
          <div class="section">
            <h2 class="section-title">Education</h2>
            {{#each education}}
            <div class="education-item">
              <div class="item-header">{{degree}} in {{field_of_study}}</div>
              <div class="item-details">{{institution_name}} | {{location}} | {{start_date}} - {{#if is_current}}Present{{else}}{{end_date}}{{/if}}</div>
              {{#if gpa}}<p>GPA: {{gpa}}</p>{{/if}}
              {{#if description}}<p>{{description}}</p>{{/if}}
            </div>
            {{/each}}
          </div>
          
          <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-list">
              {{#each skills}}
              <span class="skill-item">{{name}}{{#if proficiency_level}} ({{proficiency_level}}){{/if}}</span>
              {{/each}}
            </div>
          </div>
        </body>
      </html>
    `;

    // Simple template replacement (for demonstration)
    // In a real implementation, you'd use a proper template engine like Handlebars
    htmlContent = htmlContent
      .replace(/\{\{user\.first_name\}\}/g, user.first_name || '')
      .replace(/\{\{user\.last_name\}\}/g, user.last_name || '')
      .replace(/\{\{user\.email\}\}/g, user.email || '')
      .replace(/\{\{user\.phone\}\}/g, user.phone || '')
      .replace(/\{\{user\.address\}\}/g, user.address || '')
      .replace(/\{\{user\.city\}\}/g, user.city || '')
      .replace(/\{\{user\.state\}\}/g, user.state || '')
      .replace(/\{\{user\.zip_code\}\}/g, user.zip_code || '')
      .replace(/\{\{resume\.title\}\}/g, resume.title || '')
      .replace(/\{\{resume\.summary\}\}/g, resume.summary || '');

    // For a real implementation, you would use libraries like puppeteer or playwright
    // to generate PDF from HTML. For now, we'll create a mock PDF buffer with resume data.
    const pdfContent = JSON.stringify({
      resumeId: resume.id,
      title: resume.title,
      userInfo: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
      },
      workExperiencesCount: workExperiences.length,
      educationCount: education.length,
      skillsCount: skills.length,
      templateUsed: template?.name || 'Default Template',
      generatedAt: new Date().toISOString(),
      htmlContent: htmlContent.substring(0, 200) + '...', // Truncated for buffer size
    }, null, 2);

    return Buffer.from(pdfContent, 'utf-8');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}