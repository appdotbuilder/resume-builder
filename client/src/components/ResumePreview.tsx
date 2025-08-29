import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Mail, Phone, MapPin, Calendar, Building, Award } from 'lucide-react';
import type { Resume, User, WorkExperience, Education, Skill } from '../../../server/src/schema';

interface ResumePreviewProps {
  resume: Resume;
  user: User;
  workExperiences: WorkExperience[];
  educations: Education[];
  skills: Skill[];
}

export function ResumePreview({ resume, user, workExperiences, educations, skills }: ResumePreviewProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Present';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getProficiencyIcon = (level: string | null) => {
    switch (level) {
      case 'beginner': return '⭐';
      case 'intermediate': return '⭐⭐';
      case 'advanced': return '⭐⭐⭐';
      case 'expert': return '⭐⭐⭐⭐';
      default: return '';
    }
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          Resume Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {user.phone}
                </span>
              )}
              {(user.city || user.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[user.city, user.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {resume.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                Professional Summary
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {resume.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                Work Experience
              </h2>
              <div className="space-y-4">
                {workExperiences.map((work: WorkExperience) => (
                  <div key={work.id}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{work.job_title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {work.company_name}
                          </span>
                          {work.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {work.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(work.start_date)} - {
                            work.is_current ? 'Present' : formatDate(work.end_date)
                          }
                        </div>
                        {work.is_current && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                    {work.description && (
                      <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">
                        {work.description}
                      </p>
                    )}
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-4">
                {educations.map((edu: Education) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {edu.institution_name}
                          </span>
                          <div className="flex items-center gap-4">
                            {edu.field_of_study && (
                              <span>📚 {edu.field_of_study}</span>
                            )}
                            {edu.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {edu.location}
                              </span>
                            )}
                            {edu.gpa && (
                              <span>📊 GPA: {edu.gpa}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(edu.start_date)} - {
                            edu.is_current ? 'Present' : formatDate(edu.end_date)
                          }
                        </div>
                        {edu.is_current && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">
                        {edu.description}
                      </p>
                    )}
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                Skills
              </h2>
              <div className="space-y-4">
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h3 className="font-medium text-gray-800 mb-2 text-sm">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill: Skill) => (
                        <div key={skill.id} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {skill.name}
                            {skill.proficiency_level && (
                              <span className="ml-1">
                                {getProficiencyIcon(skill.proficiency_level)}
                              </span>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {workExperiences.length === 0 && educations.length === 0 && skills.length === 0 && !resume.summary && (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview your resume</h3>
              <p className="text-sm">
                Add your information in the tabs above to see your resume preview here! 📄
              </p>
            </div>
          )}
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600">💡</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Preview Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• This is how your resume will look when downloaded</li>
                <li>• The actual PDF may have slight formatting differences</li>
                <li>• Add more sections to create a complete resume</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}