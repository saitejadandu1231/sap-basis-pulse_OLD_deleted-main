import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import PageLayout from '@/components/layout/PageLayout';
import {
  ArrowLeft,
  Settings,
  CheckCircle,
  Search,
  Star,
  Users,
  Briefcase,
  Award,
  Zap,
  Shield,
  Database,
  Server,
  Cloud,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useSupportTypes,
  useConsultantSkills,
  useAddConsultantSkill,
  useRemoveConsultantSkill
} from '@/hooks/useSupport';

const ConsultantSkills = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<{supportTypeId: string; supportCategoryId?: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Fetch support types and consultant skills
  const { data: supportTypes, isLoading: supportTypesLoading } = useSupportTypes();
  const { data: consultantSkills, isLoading: skillsLoading } = useConsultantSkills(user?.id || '');
  const addSkillMutation = useAddConsultantSkill();
  const removeSkillMutation = useRemoveConsultantSkill();

  // Update selected skills when consultant skills data loads
  useEffect(() => {
    if (consultantSkills) {
      const skills = consultantSkills.map(skill => ({
        supportTypeId: skill.supportTypeId,
        supportCategoryId: skill.supportCategoryId || undefined
      }));
      setSelectedSkills(skills);
    }
  }, [consultantSkills]);

  const handleSkillToggle = async (skill: {supportTypeId: string; supportCategoryId?: string}, checked: boolean) => {
    if (!user?.id) return;

    try {
      if (checked) {
        // If selecting a support type (no category specified), select all categories too
        if (!skill.supportCategoryId) {
          const supportType = supportTypes?.find(type => type.id === skill.supportTypeId);
          const skillsToAdd: {supportTypeId: string; supportCategoryId?: string}[] = [{ supportTypeId: skill.supportTypeId }]; // General skill

          // Add all categories under this type
          if (supportType?.categories) {
            supportType.categories.forEach(category => {
              skillsToAdd.push({
                supportTypeId: skill.supportTypeId,
                supportCategoryId: category.id
              });
            });
          }

          // Add all skills
          for (const skillToAdd of skillsToAdd) {
            try {
              await addSkillMutation.mutateAsync({
                consultantId: user.id,
                supportTypeId: skillToAdd.supportTypeId,
                supportCategoryId: skillToAdd.supportCategoryId
              });
            } catch (error) {
              // Continue with other skills even if one fails
              console.warn('Failed to add skill:', skillToAdd, error);
            }
          }

          // Update local state
          setSelectedSkills(prev => [...prev, ...skillsToAdd]);
          toast.success(`Added ${skillsToAdd.length} skills to your expertise`);
        } else {
          // Selecting a specific category
          await addSkillMutation.mutateAsync({
            consultantId: user.id,
            supportTypeId: skill.supportTypeId,
            supportCategoryId: skill.supportCategoryId
          });
          setSelectedSkills(prev => [...prev, skill]);
          toast.success('Skill added to your expertise');
        }
      } else {
        // If deselecting a support type, deselect all categories too
        if (!skill.supportCategoryId) {
          const supportType = supportTypes?.find(type => type.id === skill.supportTypeId);
          const skillsToRemove = [];

          // Find general skill
          const generalSkill = consultantSkills?.find(s =>
            s.supportTypeId === skill.supportTypeId && !s.supportCategoryId
          );
          if (generalSkill) {
            skillsToRemove.push(generalSkill);
          }

          // Find all category skills under this type
          if (supportType?.categories) {
            supportType.categories.forEach(category => {
              const categorySkill = consultantSkills?.find(s =>
                s.supportTypeId === skill.supportTypeId && s.supportCategoryId === category.id
              );
              if (categorySkill) {
                skillsToRemove.push(categorySkill);
              }
            });
          }

          // Remove all skills
          for (const skillToRemove of skillsToRemove) {
            try {
              await removeSkillMutation.mutateAsync({
                consultantId: user.id,
                skillId: skillToRemove.id
              });
            } catch (error) {
              // Continue with other skills even if one fails
              console.warn('Failed to remove skill:', skillToRemove, error);
            }
          }

          // Update local state
          setSelectedSkills(prev => prev.filter(s =>
            s.supportTypeId !== skill.supportTypeId
          ));
          toast.success(`Removed ${skillsToRemove.length} skills from your expertise`);
        } else {
          // Deselecting a specific category
          const skillToRemove = consultantSkills?.find(s =>
            s.supportTypeId === skill.supportTypeId &&
            s.supportCategoryId === skill.supportCategoryId
          );
          if (skillToRemove) {
            await removeSkillMutation.mutateAsync({
              consultantId: user.id,
              skillId: skillToRemove.id
            });

            // Check if this was the last category under this support type
            const supportType = supportTypes?.find(type => type.id === skill.supportTypeId);
            const remainingCategories = selectedSkills.filter(s =>
              s.supportTypeId === skill.supportTypeId && s.supportCategoryId && s.supportCategoryId !== skill.supportCategoryId
            );

            // If no categories remain and there's a general skill, remove it too
            let shouldRemoveGeneralSkill = false;
            if (remainingCategories.length === 0) {
              const generalSkill = consultantSkills?.find(s =>
                s.supportTypeId === skill.supportTypeId && !s.supportCategoryId
              );
              if (generalSkill) {
                try {
                  await removeSkillMutation.mutateAsync({
                    consultantId: user.id,
                    skillId: generalSkill.id
                  });
                  shouldRemoveGeneralSkill = true;
                } catch (error) {
                  console.warn('Failed to remove general skill:', error);
                }
              }
            }

            // Update local state
            setSelectedSkills(prev => prev.filter(s => {
              // Remove the specific category
              if (s.supportTypeId === skill.supportTypeId && s.supportCategoryId === skill.supportCategoryId) {
                return false;
              }
              // Remove the general skill if no categories remain
              if (shouldRemoveGeneralSkill && s.supportTypeId === skill.supportTypeId && !s.supportCategoryId) {
                return false;
              }
              return true;
            }));

            const removedCount = shouldRemoveGeneralSkill ? 2 : 1;
            toast.success(`${removedCount === 2 ? 'Category and general skill' : 'Skill'} removed from your expertise`);
          }
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update skill');
    }
  };

  const toggleTypeExpansion = (typeId: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const getSkillIcon = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes('basis') || name.includes('system')) return Server;
    if (name.includes('cloud') || name.includes('rise')) return Cloud;
    if (name.includes('database') || name.includes('db')) return Database;
    if (name.includes('security')) return Shield;
    if (name.includes('performance')) return Zap;
    if (name.includes('migration')) return Briefcase;
    return Settings;
  };

  const filteredSupportTypes = supportTypes?.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSkillsCount = selectedSkills.length;

  return (
    <PageLayout
      title="Manage Your Expertise"
      description="Define your SAP consulting specializations to help customers find the right expert"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{selectedSkillsCount}</div>
            <div className="text-sm text-muted-foreground">Skills Selected</div>
          </div>
        </div>

        {/* Search and Stats */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Your SAP Expertise
                </h2>
                <p className="text-muted-foreground">
                  Select the areas where you have deep knowledge and experience.
                  This helps customers find consultants with the exact expertise they need.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expertise areas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Selection */}
        {supportTypesLoading || skillsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSupportTypes && filteredSupportTypes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSupportTypes.map((type) => {
              const IconComponent = getSkillIcon(type.name);
              const isExpanded = expandedTypes.has(type.id);
              const hasSelectedSkills = selectedSkills.some(s => s.supportTypeId === type.id);
              const selectedCount = selectedSkills.filter(s => s.supportTypeId === type.id).length;

              return (
                <Card
                  key={type.id}
                  className={`transition-all duration-200 hover:shadow-lg ${
                    hasSelectedSkills ? 'ring-2 ring-green-500/20 border-green-200' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          hasSelectedSkills ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          {selectedCount > 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {selectedCount} selected
                            </Badge>
                          )}
                        </div>
                      </div>
                      {type.categories?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTypeExpansion(type.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? 'Less' : 'More'}
                        </Button>
                      )}
                    </div>
                    {type.description && (
                      <CardDescription className="mt-2">{type.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* General Level */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/20">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={selectedSkills.some(s => s.supportTypeId === type.id && !s.supportCategoryId)}
                        onCheckedChange={(checked) => handleSkillToggle({ supportTypeId: type.id }, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`type-${type.id}`} className="font-medium cursor-pointer">
                          General {type.name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Broad expertise in this area
                        </p>
                      </div>
                      {selectedSkills.some(s => s.supportTypeId === type.id && !s.supportCategoryId) && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Expanded Categories and Sub-options */}
                    {isExpanded && (
                      <div className="space-y-3 pl-4 border-l-2 border-muted">
                        {/* Categories */}
                        {type.categories && type.categories.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Specialized Categories</h4>
                            {type.categories.map((category) => (
                              <div key={category.id} className="flex items-center space-x-3 p-2 rounded border bg-background">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={selectedSkills.some(s => s.supportCategoryId === category.id)}
                                  onCheckedChange={(checked) => handleSkillToggle({ supportTypeId: type.id, supportCategoryId: category.id }, checked as boolean)}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`category-${category.id}`} className="text-sm font-medium cursor-pointer">
                                    {category.name}
                                  </Label>
                                  {category.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                                  )}
                                </div>
                                {selectedSkills.some(s => s.supportCategoryId === category.id) && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">No expertise areas found</h3>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery ? 'Try adjusting your search terms.' : 'Please contact your administrator to set up expertise areas.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Selected Skills Summary */}
        {selectedSkills.length > 0 && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Your Selected Expertise ({selectedSkills.length})
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                These skills will be visible to customers when they search for consultants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill, index) => {
                  const type = supportTypes?.find(t => t.id === skill.supportTypeId);
                  const category = type?.categories?.find(c => c.id === skill.supportCategoryId);

                  let skillName = type?.name || 'Unknown';
                  let skillLevel = 'General';
                  if (category) {
                    skillName += ` → ${category.name}`;
                    skillLevel = 'Specialized';
                  }

                  return (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1"
                    >
                      <span className="font-medium">{skillName}</span>
                      <span className="ml-2 text-xs opacity-75">({skillLevel})</span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default ConsultantSkills;