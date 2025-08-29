import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createResumeInputSchema,
  updateResumeInputSchema,
  createWorkExperienceInputSchema,
  updateWorkExperienceInputSchema,
  createEducationInputSchema,
  updateEducationInputSchema,
  createSkillInputSchema,
  updateSkillInputSchema,
  createResumeTemplateInputSchema,
  getUserResumesInputSchema,
  getResumeByIdInputSchema,
  getResumeWorkExperiencesInputSchema,
  getResumeEducationsInputSchema,
  getResumeSkillsInputSchema,
  deleteInputSchema,
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { createResume } from './handlers/create_resume';
import { updateResume } from './handlers/update_resume';
import { getUserResumes } from './handlers/get_user_resumes';
import { getResumeById } from './handlers/get_resume_by_id';
import { deleteResume } from './handlers/delete_resume';
import { createWorkExperience } from './handlers/create_work_experience';
import { updateWorkExperience } from './handlers/update_work_experience';
import { getResumeWorkExperiences } from './handlers/get_resume_work_experiences';
import { deleteWorkExperience } from './handlers/delete_work_experience';
import { createEducation } from './handlers/create_education';
import { updateEducation } from './handlers/update_education';
import { getResumeEducations } from './handlers/get_resume_educations';
import { deleteEducation } from './handlers/delete_education';
import { createSkill } from './handlers/create_skill';
import { updateSkill } from './handlers/update_skill';
import { getResumeSkills } from './handlers/get_resume_skills';
import { deleteSkill } from './handlers/delete_skill';
import { createResumeTemplate } from './handlers/create_resume_template';
import { getResumeTemplates } from './handlers/get_resume_templates';
import { generateResumePDF } from './handlers/generate_resume_pdf';
import { getFullResume } from './handlers/get_full_resume';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Resume management routes
  createResume: publicProcedure
    .input(createResumeInputSchema)
    .mutation(({ input }) => createResume(input)),
  
  updateResume: publicProcedure
    .input(updateResumeInputSchema)
    .mutation(({ input }) => updateResume(input)),
  
  getUserResumes: publicProcedure
    .input(getUserResumesInputSchema)
    .query(({ input }) => getUserResumes(input)),
  
  getResumeById: publicProcedure
    .input(getResumeByIdInputSchema)
    .query(({ input }) => getResumeById(input)),
  
  deleteResume: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteResume(input)),
  
  getFullResume: publicProcedure
    .input(getResumeByIdInputSchema)
    .query(({ input }) => getFullResume(input)),

  // Work experience management routes
  createWorkExperience: publicProcedure
    .input(createWorkExperienceInputSchema)
    .mutation(({ input }) => createWorkExperience(input)),
  
  updateWorkExperience: publicProcedure
    .input(updateWorkExperienceInputSchema)
    .mutation(({ input }) => updateWorkExperience(input)),
  
  getResumeWorkExperiences: publicProcedure
    .input(getResumeWorkExperiencesInputSchema)
    .query(({ input }) => getResumeWorkExperiences(input)),
  
  deleteWorkExperience: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteWorkExperience(input)),

  // Education management routes
  createEducation: publicProcedure
    .input(createEducationInputSchema)
    .mutation(({ input }) => createEducation(input)),
  
  updateEducation: publicProcedure
    .input(updateEducationInputSchema)
    .mutation(({ input }) => updateEducation(input)),
  
  getResumeEducations: publicProcedure
    .input(getResumeEducationsInputSchema)
    .query(({ input }) => getResumeEducations(input)),
  
  deleteEducation: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteEducation(input)),

  // Skill management routes
  createSkill: publicProcedure
    .input(createSkillInputSchema)
    .mutation(({ input }) => createSkill(input)),
  
  updateSkill: publicProcedure
    .input(updateSkillInputSchema)
    .mutation(({ input }) => updateSkill(input)),
  
  getResumeSkills: publicProcedure
    .input(getResumeSkillsInputSchema)
    .query(({ input }) => getResumeSkills(input)),
  
  deleteSkill: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteSkill(input)),

  // Resume template management routes
  createResumeTemplate: publicProcedure
    .input(createResumeTemplateInputSchema)
    .mutation(({ input }) => createResumeTemplate(input)),
  
  getResumeTemplates: publicProcedure
    .query(() => getResumeTemplates()),

  // Resume generation route
  generateResumePDF: publicProcedure
    .input(getResumeByIdInputSchema)
    .mutation(({ input }) => generateResumePDF(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Resume Builder server listening at port: ${port}`);
}

start();