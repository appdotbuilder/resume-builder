import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Calendar, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Resume, CreateResumeInput } from '../../../server/src/schema';

interface ResumeListProps {
  userId: number;
  resumes: Resume[];
  selectedResume: Resume | null;
  onResumeCreated: (resume: Resume) => void;
  onResumeSelected: (resume: Resume) => void;
  onResumeDeleted: (resumeId: number) => void;
}

export function ResumeList({ 
  userId, 
  resumes, 
  selectedResume,
  onResumeCreated, 
  onResumeSelected,
  onResumeDeleted 
}: ResumeListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateResumeInput>({
    user_id: userId,
    title: '',
    summary: null,
    template_id: null,
    is_public: false,
  });

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newResume = await trpc.createResume.mutate(formData);
      onResumeCreated(newResume);
      setFormData({
        user_id: userId,
        title: '',
        summary: null,
        template_id: null,
        is_public: false,
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create resume:', error);
      alert('Failed to create resume. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    setIsDeleting(resumeId);
    try {
      await trpc.deleteResume.mutate({ id: resumeId });
      onResumeDeleted(resumeId);
    } catch (error) {
      console.error('Failed to delete resume:', error);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                My Resumes
              </CardTitle>
              <CardDescription>
                Manage and organize your resumes
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Resume
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Resume</DialogTitle>
                  <DialogDescription>
                    Start building a new resume by giving it a title.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateResume}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Resume Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateResumeInput) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="e.g., Software Engineer Resume"
                        required
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
                      {isCreating ? 'Creating...' : 'Create Resume'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first resume to get started! 🚀
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resumes.map((resume: Resume) => (
                <Card 
                  key={resume.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedResume?.id === resume.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onResumeSelected(resume)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          📄 {resume.title}
                          {selectedResume?.id === resume.id && (
                            <Badge variant="secondary" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </CardTitle>
                        {resume.summary && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {resume.summary}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeSelected(resume);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{resume.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteResume(resume.id)}
                                disabled={isDeleting === resume.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting === resume.id ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {resume.created_at.toLocaleDateString()}
                        </span>
                        <Badge variant={resume.is_public ? 'default' : 'secondary'} className="text-xs">
                          {resume.is_public ? '🌐 Public' : '🔒 Private'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}