import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Star, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Skill, CreateSkillInput, UpdateSkillInput } from '../../../server/src/schema';

interface SkillsSectionProps {
  resumeId: number;
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
}

export function SkillsSection({ 
  resumeId, 
  skills, 
  onSkillsChange 
}: SkillsSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<number | null>(null);
  
  const [createFormData, setCreateFormData] = useState<CreateSkillInput>({
    resume_id: resumeId,
    name: '',
    category: null,
    proficiency_level: null,
  });

  const [editFormData, setEditFormData] = useState<UpdateSkillInput>({
    id: 0,
    name: '',
    category: null,
    proficiency_level: null,
  });

  const proficiencyLevels = [
    { value: 'beginner', label: 'Beginner', icon: '⭐' },
    { value: 'intermediate', label: 'Intermediate', icon: '⭐⭐' },
    { value: 'advanced', label: 'Advanced', icon: '⭐⭐⭐' },
    { value: 'expert', label: 'Expert', icon: '⭐⭐⭐⭐' },
  ];

  const skillCategories = [
    'Programming Languages',
    'Web Development',
    'Mobile Development',
    'Database',
    'Cloud Computing',
    'DevOps',
    'Design',
    'Project Management',
    'Data Analysis',
    'Machine Learning',
    'Communication',
    'Leadership',
    'Other'
  ];

  const resetCreateForm = () => {
    setCreateFormData({
      resume_id: resumeId,
      name: '',
      category: null,
      proficiency_level: null,
    });
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newSkill = await trpc.createSkill.mutate(createFormData);
      onSkillsChange([...skills, newSkill]);
      resetCreateForm();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create skill:', error);
      alert('Failed to add skill. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(editFormData.id);

    try {
      const updatedSkill = await trpc.updateSkill.mutate(editFormData);
      onSkillsChange(
        skills.map((skill: Skill) => 
          skill.id === editFormData.id ? updatedSkill : skill
        )
      );
      setEditDialogOpen(null);
    } catch (error) {
      console.error('Failed to update skill:', error);
      alert('Failed to update skill. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    setIsDeleting(id);
    try {
      await trpc.deleteSkill.mutate({ id });
      onSkillsChange(skills.filter((skill: Skill) => skill.id !== id));
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Failed to delete skill. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (skill: Skill) => {
    setEditFormData({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      proficiency_level: skill.proficiency_level,
    });
    setEditDialogOpen(skill.id);
  };

  const getProficiencyIcon = (level: string | null) => {
    const proficiency = proficiencyLevels.find(p => p.value === level);
    return proficiency?.icon || '⭐';
  };

  const getProficiencyLabel = (level: string | null) => {
    const proficiency = proficiencyLevels.find(p => p.value === level);
    return proficiency?.label || 'Not specified';
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                Skills
              </CardTitle>
              <CardDescription>
                Showcase your technical and soft skills with proficiency levels
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Skill</DialogTitle>
                  <DialogDescription>
                    Add a new skill to your resume.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSkill}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="skill_name">Skill Name *</Label>
                      <Input
                        id="skill_name"
                        value={createFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateSkillInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="JavaScript, Project Management, etc."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skill_category">Category</Label>
                      <Select
                        value={createFormData.category || ''}
                        onValueChange={(value) =>
                          setCreateFormData((prev: CreateSkillInput) => ({ ...prev, category: value || null }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proficiency_level">Proficiency Level</Label>
                      <Select
                        value={createFormData.proficiency_level || ''}
                        onValueChange={(value) =>
                          setCreateFormData((prev: CreateSkillInput) => ({ 
                            ...prev, 
                            proficiency_level: value as 'beginner' | 'intermediate' | 'advanced' | 'expert' || null 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                        <SelectContent>
                          {proficiencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                <span>{level.icon}</span>
                                <span>{level.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      {isCreating ? 'Adding...' : 'Add Skill'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No skills yet</h3>
              <p className="text-gray-500 mb-4">
                Add your skills to showcase your expertise! ⭐
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categorySkills.map((skill: Skill) => (
                      <Card key={skill.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{skill.name}</h4>
                              {skill.proficiency_level && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                  <span>{getProficiencyIcon(skill.proficiency_level)}</span>
                                  <span>{getProficiencyLabel(skill.proficiency_level)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(skill)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Skill</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{skill.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteSkill(skill.id)}
                                      disabled={isDeleting === skill.id}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {isDeleting === skill.id ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update your skill details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSkill}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_skill_name">Skill Name *</Label>
                <Input
                  id="edit_skill_name"
                  value={editFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateSkillInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="JavaScript, Project Management, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_skill_category">Category</Label>
                <Select
                  value={editFormData.category || ''}
                  onValueChange={(value) =>
                    setEditFormData((prev: UpdateSkillInput) => ({ ...prev, category: value || null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_proficiency_level">Proficiency Level</Label>
                <Select
                  value={editFormData.proficiency_level || ''}
                  onValueChange={(value) =>
                    setEditFormData((prev: UpdateSkillInput) => ({ 
                      ...prev, 
                      proficiency_level: value as 'beginner' | 'intermediate' | 'advanced' | 'expert' || null 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <span>{level.icon}</span>
                          <span>{level.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {isUpdating === editFormData.id ? 'Updating...' : 'Update Skill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}