import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, Edit, Trash2, Calendar, MapPin, Award } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Education, CreateEducationInput, UpdateEducationInput } from '../../../server/src/schema';

interface EducationSectionProps {
  resumeId: number;
  educations: Education[];
  onEducationChange: (educations: Education[]) => void;
}

export function EducationSection({ 
  resumeId, 
  educations, 
  onEducationChange 
}: EducationSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<number | null>(null);
  
  const [createFormData, setCreateFormData] = useState<CreateEducationInput>({
    resume_id: resumeId,
    institution_name: '',
    degree: '',
    field_of_study: null,
    location: null,
    start_date: new Date(),
    end_date: null,
    is_current: false,
    gpa: null,
    description: null,
  });

  const [editFormData, setEditFormData] = useState<UpdateEducationInput>({
    id: 0,
    institution_name: '',
    degree: '',
    field_of_study: null,
    location: null,
    start_date: new Date(),
    end_date: null,
    is_current: false,
    gpa: null,
    description: null,
  });

  const resetCreateForm = () => {
    setCreateFormData({
      resume_id: resumeId,
      institution_name: '',
      degree: '',
      field_of_study: null,
      location: null,
      start_date: new Date(),
      end_date: null,
      is_current: false,
      gpa: null,
      description: null,
    });
  };

  const handleCreateEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newEducation = await trpc.createEducation.mutate(createFormData);
      onEducationChange([...educations, newEducation]);
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create education:', error);
      alert('Failed to add education. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(editFormData.id);

    try {
      const updatedEducation = await trpc.updateEducation.mutate(editFormData);
      onEducationChange(
        educations.map((edu: Education) => 
          edu.id === editFormData.id ? updatedEducation : edu
        )
      );
      setEditDialogOpen(null);
    } catch (error) {
      console.error('Failed to update education:', error);
      alert('Failed to update education. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteEducation = async (id: number) => {
    setIsDeleting(id);
    try {
      await trpc.deleteEducation.mutate({ id });
      onEducationChange(educations.filter((edu: Education) => edu.id !== id));
    } catch (error) {
      console.error('Failed to delete education:', error);
      alert('Failed to delete education. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (education: Education) => {
    setEditFormData({
      id: education.id,
      institution_name: education.institution_name,
      degree: education.degree,
      field_of_study: education.field_of_study,
      location: education.location,
      start_date: education.start_date,
      end_date: education.end_date,
      is_current: education.is_current,
      gpa: education.gpa,
      description: education.description,
    });
    setEditDialogOpen(education.id);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Education
              </CardTitle>
              <CardDescription>
                Add your educational background and academic achievements
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Education
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Education</DialogTitle>
                  <DialogDescription>
                    Provide details about your educational background.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEducation}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution_name">Institution *</Label>
                      <Input
                        id="institution_name"
                        value={createFormData.institution_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateEducationInput) => ({ ...prev, institution_name: e.target.value }))
                        }
                        placeholder="University of California, Berkeley"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="degree">Degree *</Label>
                        <Input
                          id="degree"
                          value={createFormData.degree}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ ...prev, degree: e.target.value }))
                          }
                          placeholder="Bachelor of Science"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field_of_study">Field of Study</Label>
                        <Input
                          id="field_of_study"
                          value={createFormData.field_of_study || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ ...prev, field_of_study: e.target.value || null }))
                          }
                          placeholder="Computer Science"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={createFormData.location || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ ...prev, location: e.target.value || null }))
                          }
                          placeholder="Berkeley, CA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gpa">GPA</Label>
                        <Input
                          id="gpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={createFormData.gpa || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ 
                              ...prev, 
                              gpa: e.target.value ? parseFloat(e.target.value) : null 
                            }))
                          }
                          placeholder="3.8"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formatDate(createFormData.start_date)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ ...prev, start_date: parseDate(e.target.value) }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={createFormData.end_date ? formatDate(createFormData.end_date) : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateEducationInput) => ({ 
                              ...prev, 
                              end_date: e.target.value ? parseDate(e.target.value) : null 
                            }))
                          }
                          disabled={createFormData.is_current}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_current"
                        checked={createFormData.is_current}
                        onCheckedChange={(checked: boolean) =>
                          setCreateFormData((prev: CreateEducationInput) => ({ 
                            ...prev, 
                            is_current: checked,
                            end_date: checked ? null : prev.end_date
                          }))
                        }
                      />
                      <Label htmlFor="is_current">I am currently studying here</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={createFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateFormData((prev: CreateEducationInput) => ({ ...prev, description: e.target.value || null }))
                        }
                        placeholder="Relevant coursework, honors, achievements, activities..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Adding...' : 'Add Education'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {educations.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No education yet</h3>
              <p className="text-gray-500 mb-4">
                Add your educational background to showcase your academic journey! 🎓
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {educations.map((education: Education) => (
                <Card key={education.id} className="hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🎓 {education.degree}
                          {education.is_current && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex flex-col gap-1 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {education.institution_name}
                          </span>
                          <div className="flex items-center gap-4">
                            {education.field_of_study && (
                              <span>📚 {education.field_of_study}</span>
                            )}
                            {education.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {education.location}
                              </span>
                            )}
                            {education.gpa && (
                              <span>📊 GPA: {education.gpa}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(education)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Education</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this education entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEducation(education.id)}
                                disabled={isDeleting === education.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting === education.id ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <Calendar className="h-3 w-3" />
                      {education.start_date.toLocaleDateString()} - {
                        education.is_current ? 'Present' : education.end_date?.toLocaleDateString() || 'Not specified'
                      }
                    </div>
                    {education.description && (
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {education.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen !== null} 
        onOpenChange={(open) => !open && setEditDialogOpen(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Education</DialogTitle>
            <DialogDescription>
              Update your education details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEducation}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_institution_name">Institution *</Label>
                <Input
                  id="edit_institution_name"
                  value={editFormData.institution_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateEducationInput) => ({ ...prev, institution_name: e.target.value }))
                  }
                  placeholder="University of California, Berkeley"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_degree">Degree *</Label>
                  <Input
                    id="edit_degree"
                    value={editFormData.degree}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ ...prev, degree: e.target.value }))
                    }
                    placeholder="Bachelor of Science"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_field_of_study">Field of Study</Label>
                  <Input
                    id="edit_field_of_study"
                    value={editFormData.field_of_study || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ ...prev, field_of_study: e.target.value || null }))
                    }
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_location">Location</Label>
                  <Input
                    id="edit_location"
                    value={editFormData.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ ...prev, location: e.target.value || null }))
                    }
                    placeholder="Berkeley, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_gpa">GPA</Label>
                  <Input
                    id="edit_gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={editFormData.gpa || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ 
                        ...prev, 
                        gpa: e.target.value ? parseFloat(e.target.value) : null 
                      }))
                    }
                    placeholder="3.8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_start_date">Start Date *</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={editFormData.start_date ? formatDate(editFormData.start_date) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ ...prev, start_date: parseDate(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_end_date">End Date</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={editFormData.end_date ? formatDate(editFormData.end_date) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateEducationInput) => ({ 
                        ...prev, 
                        end_date: e.target.value ? parseDate(e.target.value) : null 
                      }))
                    }
                    disabled={editFormData.is_current}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_current"
                  checked={editFormData.is_current}
                  onCheckedChange={(checked: boolean) =>
                    setEditFormData((prev: UpdateEducationInput) => ({ 
                      ...prev, 
                      is_current: checked,
                      end_date: checked ? null : prev.end_date
                    }))
                  }
                />
                <Label htmlFor="edit_is_current">I am currently studying here</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateEducationInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Relevant coursework, honors, achievements, activities..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating === editFormData.id}>
                {isUpdating === editFormData.id ? 'Updating...' : 'Update Education'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}