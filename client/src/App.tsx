import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, User as UserIcon, Briefcase, GraduationCap, Star, Palette, Download } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';
import { ResumeList } from '@/components/ResumeList';
import { WorkExperienceSection } from '@/components/WorkExperienceSection';
import { EducationSection } from '@/components/EducationSection';
import { SkillsSection } from '@/components/SkillsSection';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ResumePreview } from '@/components/ResumePreview';
import type { User, Resume, WorkExperience, Education, Skill, ResumeTemplate } from '../../server/src/schema';

function App() {
  // State management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [userResumes, setUserResumes] = useState<Resume[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resumes');

  // Load templates on app start
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await trpc.getResumeTemplates.query();
        setTemplates(templateList);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Load resume details when a resume is selected
  const loadResumeDetails = useCallback(async (resumeId: number) => {
    try {
      setIsLoading(true);
      const [workExps, edus, skillsList] = await Promise.all([
        trpc.getResumeWorkExperiences.query({ resume_id: resumeId }),
        trpc.getResumeEducations.query({ resume_id: resumeId }),
        trpc.getResumeSkills.query({ resume_id: resumeId })
      ]);
      setWorkExperiences(workExps);
      setEducations(edus);
      setSkills(skillsList);
    } catch (error) {
      console.error('Failed to load resume details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user resumes when user is set
  const loadUserResumes = useCallback(async (userId: number) => {
    try {
      const resumes = await trpc.getUserResumes.query({ user_id: userId });
      setUserResumes(resumes);
    } catch (error) {
      console.error('Failed to load user resumes:', error);
    }
  }, []);

  // Handle user creation/selection
  const handleUserCreated = useCallback((user: User) => {
    setCurrentUser(user);
    loadUserResumes(user.id);
  }, [loadUserResumes]);

  // Handle resume selection
  const handleResumeSelected = useCallback((resume: Resume) => {
    setSelectedResume(resume);
    loadResumeDetails(resume.id);
    setActiveTab('personal');
  }, [loadResumeDetails]);

  // Handle resume creation
  const handleResumeCreated = useCallback((resume: Resume) => {
    setUserResumes((prev: Resume[]) => [...prev, resume]);
    setSelectedResume(resume);
    setWorkExperiences([]);
    setEducations([]);
    setSkills([]);
    setActiveTab('personal');
  }, []);

  // Handle resume deletion
  const handleResumeDeleted = useCallback((resumeId: number) => {
    setUserResumes((prev: Resume[]) => prev.filter((r: Resume) => r.id !== resumeId));
    if (selectedResume?.id === resumeId) {
      setSelectedResume(null);
      setWorkExperiences([]);
      setEducations([]);
      setSkills([]);
      setActiveTab('resumes');
    }
  }, [selectedResume]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!selectedResume) return;
    
    try {
      setIsLoading(true);
      const pdfBuffer = await trpc.generateResumePDF.mutate({ id: selectedResume.id });
      
      // Create blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedResume.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Resume Builder</h1>
          </div>
          <p className="text-lg text-gray-600">
            Create professional resumes with ease 📄✨
          </p>
          {currentUser && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-sm">
                👋 Welcome, {currentUser.first_name} {currentUser.last_name}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content */}
        {!currentUser ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Get Started
              </CardTitle>
              <CardDescription>
                Create your profile to start building resumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm onUserCreated={handleUserCreated} />
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList className="grid grid-cols-6 w-fit">
                <TabsTrigger value="resumes" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Resumes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="personal" 
                  disabled={!selectedResume}
                  className="flex items-center gap-1"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="experience" 
                  disabled={!selectedResume}
                  className="flex items-center gap-1"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Experience</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="education" 
                  disabled={!selectedResume}
                  className="flex items-center gap-1"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Education</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="skills" 
                  disabled={!selectedResume}
                  className="flex items-center gap-1"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Skills</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="template" 
                  disabled={!selectedResume}
                  className="flex items-center gap-1"
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Template</span>
                </TabsTrigger>
              </TabsList>

              {selectedResume && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    📄 {selectedResume.title}
                  </Badge>
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    {isLoading ? 'Generating...' : 'Download PDF'}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TabsContent value="resumes" className="mt-0">
                  <ResumeList
                    userId={currentUser.id}
                    resumes={userResumes}
                    selectedResume={selectedResume}
                    onResumeCreated={handleResumeCreated}
                    onResumeSelected={handleResumeSelected}
                    onResumeDeleted={handleResumeDeleted}
                  />
                </TabsContent>

                <TabsContent value="personal" className="mt-0">
                  {selectedResume && (
                    <PersonalInfoForm
                      user={currentUser}
                      resume={selectedResume}
                      onUserUpdated={setCurrentUser}
                      onResumeUpdated={setSelectedResume}
                    />
                  )}
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  {selectedResume && (
                    <WorkExperienceSection
                      resumeId={selectedResume.id}
                      workExperiences={workExperiences}
                      onWorkExperienceChange={setWorkExperiences}
                    />
                  )}
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  {selectedResume && (
                    <EducationSection
                      resumeId={selectedResume.id}
                      educations={educations}
                      onEducationChange={setEducations}
                    />
                  )}
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  {selectedResume && (
                    <SkillsSection
                      resumeId={selectedResume.id}
                      skills={skills}
                      onSkillsChange={setSkills}
                    />
                  )}
                </TabsContent>

                <TabsContent value="template" className="mt-0">
                  {selectedResume && (
                    <TemplateSelector
                      resume={selectedResume}
                      templates={templates}
                      onResumeUpdated={setSelectedResume}
                    />
                  )}
                </TabsContent>
              </div>

              {/* Preview Panel */}
              <div className="lg:col-span-1">
                {selectedResume && (
                  <ResumePreview
                    resume={selectedResume}
                    user={currentUser}
                    workExperiences={workExperiences}
                    educations={educations}
                    skills={skills}
                  />
                )}
              </div>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default App;