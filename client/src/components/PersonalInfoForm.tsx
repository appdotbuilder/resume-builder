import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Mail, Phone, MapPin, Save } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, Resume, CreateUserInput, UpdateUserInput, UpdateResumeInput } from '../../../server/src/schema';

interface PersonalInfoFormProps {
  user?: UserType;
  resume?: Resume;
  onUserCreated?: (user: UserType) => void;
  onUserUpdated?: (user: UserType) => void;
  onResumeUpdated?: (resume: Resume) => void;
}

export function PersonalInfoForm({ 
  user, 
  resume, 
  onUserCreated, 
  onUserUpdated, 
  onResumeUpdated 
}: PersonalInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userFormData, setUserFormData] = useState<CreateUserInput | UpdateUserInput>(
    user ? {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zip_code: user.zip_code,
      country: user.country,
    } : {
      email: '',
      first_name: '',
      last_name: '',
      phone: null,
      address: null,
      city: null,
      state: null,
      zip_code: null,
      country: null,
    }
  );

  const [resumeFormData, setResumeFormData] = useState<UpdateResumeInput>(
    resume ? {
      id: resume.id,
      title: resume.title,
      summary: resume.summary,
    } : {
      id: 0,
      title: '',
      summary: null,
    }
  );

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user) {
        // Update existing user
        const updatedUser = await trpc.updateUser.mutate(userFormData as UpdateUserInput);
        onUserUpdated?.(updatedUser);
      } else {
        // Create new user
        const newUser = await trpc.createUser.mutate(userFormData as CreateUserInput);
        onUserCreated?.(newUser);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save personal information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume) return;

    setIsLoading(true);
    try {
      const updatedResume = await trpc.updateResume.mutate(resumeFormData);
      onResumeUpdated?.(updatedResume);
    } catch (error) {
      console.error('Failed to update resume:', error);
      alert('Failed to update resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>
            {user ? 'Update your personal details' : 'Enter your personal information to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={userFormData.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserFormData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={userFormData.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserFormData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={userFormData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev) => ({ ...prev, phone: e.target.value || null }))
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Street Address
              </Label>
              <Input
                id="address"
                value={userFormData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev) => ({ ...prev, address: e.target.value || null }))
                }
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={userFormData.city || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserFormData((prev) => ({ ...prev, city: e.target.value || null }))
                  }
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={userFormData.state || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserFormData((prev) => ({ ...prev, state: e.target.value || null }))
                  }
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={userFormData.zip_code || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserFormData((prev) => ({ ...prev, zip_code: e.target.value || null }))
                  }
                  placeholder="10001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={userFormData.country || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev) => ({ ...prev, country: e.target.value || null }))
                }
                placeholder="United States"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : user ? 'Update Profile' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resume Details Card */}
      {resume && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📄 Resume Details
            </CardTitle>
            <CardDescription>
              Customize your resume title and summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResumeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume_title">Resume Title *</Label>
                <Input
                  id="resume_title"
                  value={resumeFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResumeFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Software Engineer Resume"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_summary">Professional Summary</Label>
                <Textarea
                  id="resume_summary"
                  value={resumeFormData.summary || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setResumeFormData((prev) => ({ ...prev, summary: e.target.value || null }))
                  }
                  placeholder="Write a brief professional summary highlighting your key skills and experience..."
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? 'Updating...' : 'Update Resume Details'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}