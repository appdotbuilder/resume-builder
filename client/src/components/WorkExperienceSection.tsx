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
import { Briefcase, Plus, Edit, Trash2, Calendar, MapPin, Building } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { WorkExperience, CreateWorkExperienceInput, UpdateWorkExperienceInput } from '../../../server/src/schema';

interface WorkExperienceSectionProps {
  resumeId: number;
  workExperiences: WorkExperience[];
  onWorkExperienceChange: (workExperiences: WorkExperience[]) => void;
}

export function WorkExperienceSection({ 
  resumeId, 
  workExperiences, 
  onWorkExperienceChange 
}: WorkExperienceSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<number | null>(null);
  
  const [createFormData, setCreateFormData] = useState<CreateWorkExperienceInput>({
    resume_id: resumeId,
    company_name: '',
    job_title: '',
    location: null,
    start_date: new Date(),
    end_date: null,
    is_current: false,
    description: null,
  });

  const [editFormData, setEditFormData] = useState<UpdateWorkExperienceInput>({
    id: 0,
    company_name: '',
    job_title: '',
    location: null,
    start_date: new Date(),
    end_date: null,
    is_current: false,
    description: null,
  });

  const resetCreateForm = () => {
    setCreateFormData({
      resume_id: resumeId,
      company_name: '',
      job_title: '',
      location: null,
      start_date: new Date(),
      end_date: null,
      is_current: false,
      description: null,
    });
  };

  const handleCreateWorkExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newWorkExperience = await trpc.createWorkExperience.mutate(createFormData);
      onWorkExperienceChange([...workExperiences, newWorkExperience]);
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create work experience:', error);
      alert('Failed to add work experience. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateWorkExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(editFormData.id);

    try {
      const updatedWorkExperience = await trpc.updateWorkExperience.mutate(editFormData);
      onWorkExperienceChange(
        workExperiences.map((we: WorkExperience) => 
          we.id === editFormData.id ? updatedWorkExperience : we
        )
      );
      setEditDialogOpen(null);
    } catch (error) {
      console.error('Failed to update work experience:', error);
      alert('Failed to update work experience. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteWorkExperience = async (id: number) => {
    setIsDeleting(id);
    try {
      await trpc.deleteWorkExperience.mutate({ id });
      onWorkExperienceChange(workExperiences.filter((we: WorkExperience) => we.id !== id));
    } catch (error) {
      console.error('Failed to delete work experience:', error);
      alert('Failed to delete work experience. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (workExperience: WorkExperience) => {
    setEditFormData({
      id: workExperience.id,
      company_name: workExperience.company_name,
      job_title: workExperience.job_title,
      location: workExperience.location,
      start_date: workExperience.start_date,
      end_date: workExperience.end_date,
      is_current: workExperience.is_current,
      description: workExperience.description,
    });
    setEditDialogOpen(workExperience.id);
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
                <Briefcase className="h-5 w-5 text-blue-600" />
                Work Experience
              </CardTitle>
              <CardDescription>
                Add your professional work history and achievements
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Work Experience</DialogTitle>
                  <DialogDescription>
                    Provide details about your work experience.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateWorkExperience}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title *</Label>
                        <Input
                          id="job_title"
                          value={createFormData.job_title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateWorkExperienceInput) => ({ ...prev, job_title: e.target.value }))
                          }
                          placeholder="Software Engineer"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company *</Label>
                        <Input
                          id="company_name"
                          value={createFormData.company_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateWorkExperienceInput) => ({ ...prev, company_name: e.target.value }))
                          }
                          placeholder="Tech Corp"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={createFormData.location || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateWorkExperienceInput) => ({ ...prev, location: e.target.value || null }))
                        }
                        placeholder="New York, NY"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formatDate(createFormData.start_date)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateWorkExperienceInput) => ({ ...prev, start_date: parseDate(e.target.value) }))
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
                            setCreateFormData((prev: CreateWorkExperienceInput) => ({ 
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
                          setCreateFormData((prev: CreateWorkExperienceInput) => ({ 
                            ...prev, 
                            is_current: checked,
                            end_date: checked ? null : prev.end_date
                          }))
                        }
                      />
                      <Label htmlFor="is_current">I currently work here</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        value={createFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateFormData((prev: CreateWorkExperienceInput) => ({ ...prev, description: e.target.value || null }))
                        }
                        placeholder="Describe your responsibilities, achievements, and key projects..."
                        rows={4}
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
                      {isCreating ? 'Adding...' : 'Add Experience'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {workExperiences.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience yet</h3>
              <p className="text-gray-500 mb-4">
                Add your professional experience to showcase your career journey! 💼
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperiences.map((workExp: WorkExperience) => (
                <Card key={workExp.id} className="hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          💼 {workExp.job_title}
                          {workExp.is_current && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {workExp.company_name}
                          </span>
                          {workExp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {workExp.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(workExp)}
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
                              <AlertDialogTitle>Delete Work Experience</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this work experience? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWorkExperience(workExp.id)}
                                disabled={isDeleting === workExp.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting === workExp.id ? 'Deleting...' : 'Delete'}
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
                      {workExp.start_date.toLocaleDateString()} - {
                        workExp.is_current ? 'Present' : workExp.end_date?.toLocaleDateString() || 'Not specified'
                      }
                    </div>
                    {workExp.description && (
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {workExp.description}
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
            <DialogTitle>Edit Work Experience</DialogTitle>
            <DialogDescription>
              Update your work experience details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWorkExperience}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_job_title">Job Title *</Label>
                  <Input
                    id="edit_job_title"
                    value={editFormData.job_title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateWorkExperienceInput) => ({ ...prev, job_title: e.target.value }))
                    }
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_company_name">Company *</Label>
                  <Input
                    id="edit_company_name"
                    value={editFormData.company_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateWorkExperienceInput) => ({ ...prev, company_name: e.target.value }))
                    }
                    placeholder="Tech Corp"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_location">Location</Label>
                <Input
                  id="edit_location"
                  value={editFormData.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateWorkExperienceInput) => ({ ...prev, location: e.target.value || null }))
                  }
                  placeholder="New York, NY"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_start_date">Start Date *</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={editFormData.start_date ? formatDate(editFormData.start_date) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateWorkExperienceInput) => ({ ...prev, start_date: parseDate(e.target.value) }))
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
                      setEditFormData((prev: UpdateWorkExperienceInput) => ({ 
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
                    setEditFormData((prev: UpdateWorkExperienceInput) => ({ 
                      ...prev, 
                      is_current: checked,
                      end_date: checked ? null : prev.end_date
                    }))
                  }
                />
                <Label htmlFor="edit_is_current">I currently work here</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Job Description</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateWorkExperienceInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  rows={4}
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
                {isUpdating === editFormData.id ? 'Updating...' : 'Update Experience'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}