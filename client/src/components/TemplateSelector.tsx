import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Resume, ResumeTemplate, UpdateResumeInput } from '../../../server/src/schema';

interface TemplateSelectorProps {
  resume: Resume;
  templates: ResumeTemplate[];
  onResumeUpdated: (resume: Resume) => void;
}

export function TemplateSelector({ resume, templates, onResumeUpdated }: TemplateSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

  const handleSelectTemplate = async (templateId: number | null) => {
    setIsUpdating(true);
    try {
      const updateData: UpdateResumeInput = {
        id: resume.id,
        template_id: templateId,
      };
      const updatedResume = await trpc.updateResume.mutate(updateData);
      onResumeUpdated(updatedResume);
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentTemplate = () => {
    return templates.find((t: ResumeTemplate) => t.id === resume.template_id) || null;
  };

  const currentTemplate = getCurrentTemplate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            Resume Templates
          </CardTitle>
          <CardDescription>
            Choose a template to customize the look and feel of your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Template */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Current Template</h3>
            {currentTemplate ? (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">{currentTemplate.name}</h4>
                      {currentTemplate.description && (
                        <p className="text-sm text-blue-700 mt-1">{currentTemplate.description}</p>
                      )}
                    </div>
                    <Badge className="bg-blue-600">Current</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-4">
                  <div className="text-center text-gray-500">
                    <Palette className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No template selected</p>
                    <p className="text-sm">Choose a template below to style your resume</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Templates */}
          <div>
            <h3 className="text-lg font-medium mb-4">Available Templates</h3>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No templates available</h4>
                <p className="text-gray-500">
                  Templates are currently being prepared. Check back later! 🎨
                </p>
              </div>
            ) : (
              <>
                {/* Default/No Template Option */}
                <Card 
                  className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
                    !resume.template_id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectTemplate(null)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Default Template</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Simple, clean layout with basic styling
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!resume.template_id && (
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUpdating}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(null);
                          }}
                        >
                          {isUpdating && !resume.template_id ? 'Selecting...' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Templates */}
                <div className="grid gap-4">
                  {templates.map((template: ResumeTemplate) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        resume.template_id === template.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{template.name}</h4>
                              {!template.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600">{template.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {resume.template_id === template.id && (
                              <Badge variant="secondary">
                                <Check className="h-3 w-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating || !template.is_active}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTemplate(template.id);
                              }}
                            >
                              {isUpdating && resume.template_id === template.id 
                                ? 'Selecting...' 
                                : 'Select'
                              }
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Template Preview Modal (Future Enhancement) */}
          {previewTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{previewTemplate.name} Preview</CardTitle>
                      <CardDescription>Template preview coming soon</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setPreviewTemplate(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-8 rounded-lg text-center">
                    <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Template preview will be available soon!
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      You can still select this template and see how it looks in your final resume.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Template Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>• Choose wisely:</strong> Different templates work better for different industries and roles.
            </p>
            <p>
              <strong>• Preview your resume:</strong> Use the preview panel to see how your content looks with the selected template.
            </p>
            <p>
              <strong>• Change anytime:</strong> You can switch templates at any point without losing your content.
            </p>
            <p>
              <strong>• Professional appearance:</strong> All templates are designed to create ATS-friendly, professional resumes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}