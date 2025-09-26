import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    AlertCircle,
    Clock,
    User,
    FileText,
    Settings,
    Star,
    Calendar
} from 'lucide-react';
import { 
    useSupportTypes, 
    useSupportCategories, 
    useSupportSubOptions, 
    useConsultantAvailabilitySlots,
    useCreateSupportRequest,
    useAvailableConsultants 
} from '@/hooks/useSupport';
// payment creation is deferred until consultant closes the ticket (pay-on-close)
// We still show the computed amount in the review step, but do not create Razorpay orders here
import { useConsultantPublicProfile } from '@/hooks/useConsultantProfile';
import { useValidateServiceRequestIdentifier } from '@/hooks/useServiceRequestIdentifier';

const priorityOptions = [
    { id: 'Low', name: 'Low', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
    { id: 'Medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    { id: 'High', name: 'High', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
    { id: 'VeryHigh', name: 'Very High', color: 'bg-red-100 text-red-800', icon: '🔴' },
];

const STEPS = [
    { id: 'type', title: 'Support Type', icon: Settings, description: 'Choose the type of support you need' },
    { id: 'category', title: 'Category', icon: FileText, description: 'Select the specific category' },
    { id: 'details', title: 'Details', icon: AlertCircle, description: 'Provide request details' },
    { id: 'consultant', title: 'Consultant', icon: User, description: 'Choose consultant and time' },
    { id: 'review', title: 'Review', icon: Check, description: 'Review and submit your request' }
];

const SupportSelection = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [selectedSupport, setSelectedSupport] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubOption, setSelectedSubOption] = useState('');
  const [description, setDescription] = useState('');
  const [srIdentifier, setSrIdentifier] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [consultantShowingReviews, setConsultantShowingReviews] = useState<string | null>(null);
  
  // Validate SR Identifier if it's entered
  const { data: srValidationResult, isLoading: validatingSrIdentifier } = 
    useValidateServiceRequestIdentifier(srIdentifier);

  useEffect(() => {
    if (userRole === 'consultant') {
      toast.error('Consultants cannot create support requests');
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  const { data: supportTypes, isLoading: loadingTypes } = useSupportTypes();
  const { data: supportCategories, isLoading: loadingCategories } = useSupportCategories(selectedSupport);
  const { data: consultants, isLoading: consultantsLoading } = useAvailableConsultants();
  const { data: supportSubOptionsData, isLoading: loadingSubOptions } = useSupportSubOptions(selectedSupport || undefined);
  const supportSubOptions = useMemo(() => selectedSupport ? supportSubOptionsData : [], [selectedSupport, supportSubOptionsData]);

  // Auto-advance when SR identifier becomes valid
  useEffect(() => {
    if (currentStep === 1 && selectedSubOption && srIdentifier && srValidationResult?.isValid) {
      const selectedSubOptionObj = supportSubOptions?.find(option => option.id === selectedSubOption);
      const needsSrIdentifier = selectedSubOptionObj?.name === 'Service Request (SR)';
      
      if (needsSrIdentifier) {
        // Small delay to allow user to see the validation success message
        setTimeout(() => nextStep(), 800);
      }
    }
  }, [currentStep, selectedSubOption, srIdentifier, srValidationResult?.isValid, supportSubOptions]);

  // Get today's and next week's date strings for availability slot range
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const startDate = today.toISOString().split('T')[0];
  const endDate = nextWeek.toISOString().split('T')[0];

  const { data: timeSlotsData, isLoading: loadingSlots } = useConsultantAvailabilitySlots(
    selectedConsultant || null,
    startDate,
    endDate
  );
  const timeSlots = useMemo(() => selectedConsultant ? timeSlotsData : [], [selectedConsultant, timeSlotsData]);

  // Load consultant public profile to get hourly rate when a consultant is selected
  const { data: consultantProfile } = useConsultantPublicProfile(selectedConsultant || null);

  const createRequest = useCreateSupportRequest();

  // Step navigation logic
  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Auto-advance logic
  const handleSupportTypeChange = (value: string) => {
    setSelectedSupport(value);
    setSelectedCategory('');
    setSelectedSubOption('');
    setSrIdentifier('');
    setSelectedConsultant('');
    setSelectedTimeSlot('');
    // Auto-advance to next step
    setTimeout(() => nextStep(), 300);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubOption('');
    setSrIdentifier('');
    setSelectedConsultant('');
    setSelectedTimeSlot('');
    // Don't auto-advance to allow sub-option selection
  };

  const handleSubOptionChange = (value: string) => {
    setSelectedSubOption(value);
    setSrIdentifier('');
    setSelectedConsultant('');
    setSelectedTimeSlot('');
    
    // Check if this sub-option requires SR identifier
    const selectedSubOptionObj = supportSubOptions?.find(option => option.id === value);
    const needsSrIdentifier = selectedSubOptionObj?.name === 'Service Request (SR)';
    
    // Only auto-advance if SR identifier is NOT required
    if (!needsSrIdentifier) {
      setTimeout(() => nextStep(), 300);
    }
  };

  // Validation for each step
  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return !!selectedSupport;
      case 1: {
        if (!selectedCategory) return false;
        // If there are sub-options available, one must be selected
        if (supportSubOptions && supportSubOptions.length > 0) {
          if (!selectedSubOption) return false;
          // If SR Identifier is required for this sub-option, it must be provided and valid
          const selectedSubOptionObj = supportSubOptions?.find(option => option.id === selectedSubOption);
          const needsSrIdentifier = selectedSubOptionObj?.name === 'Service Request (SR)';
          if (needsSrIdentifier) {
            if (!srIdentifier.trim()) return false;
            if (!srValidationResult?.isValid) return false;
          }
        }
        return true;
      }
      case 2: return !!description && !!selectedPriority;
      case 3: return !!selectedConsultant && !!selectedTimeSlot;
      case 4: return true; // Review step
      default: return false;
    }
  };

  const canProceedToNext = () => {
    return isStepValid(currentStep);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!selectedSupport || !selectedCategory || !description.trim() || !selectedPriority || !selectedConsultant || !selectedTimeSlot) {
      toast.error('Please complete all steps before submitting.');
      return;
    }

    const selectedSupportTypeObj = supportTypes?.find(type => type.id === selectedSupport);
    const selectedSubOptionObj = supportSubOptions?.find(option => option.id === selectedSubOption);
    
    const needsSrIdentifier = 
      (selectedSubOptionObj?.requiresSrIdentifier !== undefined ? 
        selectedSubOptionObj?.requiresSrIdentifier : 
        selectedSubOptionObj?.name === 'Service Request (SR)') && 
      (selectedSupportTypeObj?.name === 'SAP RISE' || selectedSupportTypeObj?.name === 'SAP Grow');

    if (needsSrIdentifier) {
      if (!srIdentifier.trim()) {
        toast.error('SR Identifier is required for this request type.');
        return;
      }
      if (!srValidationResult?.isValid) {
        toast.error('Please enter a valid SR Identifier.');
        return;
      }
    }

    try {
      const created = await createRequest.mutateAsync({
        supportTypeId: selectedSupport,
        supportCategoryId: selectedCategory,
        supportSubOptionId: selectedSubOption || undefined,
        description,
        srIdentifier: needsSrIdentifier ? srIdentifier.trim() : undefined,
        priority: selectedPriority,
        consultantId: selectedConsultant,
        timeSlotId: selectedTimeSlot
      });

      // Pay-on-close flow: do not create Razorpay order or open checkout now.
      // The customer will be charged when the consultant closes the ticket.
      toast.success('Support request submitted. You will be asked to pay once the consultant closes the ticket.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating support request:', error);
      toast.error(error?.message || 'Failed to create support request');
    }
  };

  // Step components
  const renderStepContent = () => {
    const selectedSupportTypeObj = supportTypes?.find(type => type.id === selectedSupport);
    const selectedCategoryObj = supportCategories?.find(cat => cat.id === selectedCategory);
    const selectedSubOptionObj = supportSubOptions?.find(option => option.id === selectedSubOption);
    const selectedPriorityObj = priorityOptions.find(p => p.id === selectedPriority);
    const selectedConsultantObj = consultants?.find(c => c.id === selectedConsultant);
    const selectedTimeSlotObj = timeSlots?.find(slot => slot.id === selectedTimeSlot);

    switch (currentStep) {
      case 0: // Support Type
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-6 sm:mb-8">
              {/* Enhanced Progress Bar */}
              <div className="bg-muted/30 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
                {/* Step indicators with connecting line */}
                <div className="flex items-center justify-between mb-4 overflow-x-auto">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                      <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                        <div className="flex flex-col items-center relative">
                          {/* Step Circle */}
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3 h-3 sm:w-6 sm:h-6" />
                            ) : (
                              <StepIcon className="w-3 h-3 sm:w-6 sm:h-6" />
                            )}
                          </div>
                          
                          {/* Step Label */}
                          <div className="mt-2 sm:mt-3 text-center max-w-[60px] sm:max-w-none">
                            <p className={`text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              <span className="hidden sm:inline">{step.title}</span>
                              <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 sm:mx-4 mt-3 sm:mt-6 relative min-w-[20px] sm:min-w-[40px]">
                            <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full' : 'bg-transparent w-0'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Desktop Progress Bar */}
                <div className="hidden sm:block space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      Step {currentStep + 1} of {STEPS.length} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Step Header - Hidden on Mobile (info shown in progress) */}
              <div className="hidden sm:flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Select Support Type</h2>
                  <p className="text-base text-muted-foreground">Choose the type of support you need</p>
                </div>
              </div>
            </div>
            
            {loadingTypes ? (
              <div className="text-center py-8">Loading support types...</div>
            ) : (
              <div className="space-y-3">
                {supportTypes?.map(type => (
                  <Card 
                    key={type.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                      selectedSupport === type.id ? 'ring-2 ring-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSupportTypeChange(type.id)}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight">{type.name}</h3>
                          {type.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{type.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {selectedSupport === type.id && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 1: // Category
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-6 sm:mb-8">
              {/* Mobile-First Progress Bar */}
              <div className="bg-muted/30 rounded-xl p-3 sm:p-6 mb-4 sm:mb-6">
                {/* Mobile: Simple current step indicator */}
                <div className="block sm:hidden mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{currentStep + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{STEPS[currentStep].title}</p>
                        <p className="text-xs text-muted-foreground">{STEPS[currentStep].description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {currentStep + 1}/{STEPS.length}
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-teal-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Desktop: Full step indicators */}
                <div className="hidden sm:flex items-center justify-between mb-4">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                      <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center relative">
                          {/* Step Circle */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive 
                              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg shadow-green-500/30 scale-110' 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <StepIcon className="w-6 h-6" />
                            )}
                          </div>
                          
                          {/* Step Label */}
                          <div className="mt-3 text-center">
                            <p className={`text-xs font-medium transition-colors ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              {step.title}
                            </p>
                          </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-4 mt-6 relative">
                            <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full' : 'bg-transparent w-0'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      Step {currentStep + 1} of {STEPS.length} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-teal-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Step Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Select Category</h2>
                  <p className="text-muted-foreground">Choose the specific category for your request</p>
                  {selectedSupportTypeObj && (
                    <Badge variant="secondary" className="mt-2">
                      {selectedSupportTypeObj.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {loadingCategories ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : (
              <div className="grid gap-4">
                {supportCategories?.map(category => (
                  <Card 
                    key={category.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory === category.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          )}
                        </div>
                        {selectedCategory === category.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Sub-options if category is selected */}
            {selectedCategory && supportSubOptions && supportSubOptions.length > 0 && (
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Select Sub-category</h3>
                  <p className="text-muted-foreground">Choose the specific type for your request</p>
                </div>
                
                {loadingSubOptions ? (
                  <div className="text-center py-4">Loading sub-options...</div>
                ) : (
                  <div className="grid gap-3">
                    {supportSubOptions.map(subOption => (
                      <Card 
                        key={subOption.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedSubOption === subOption.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleSubOptionChange(subOption.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{subOption.name}</h4>
                              {subOption.description && (
                                <p className="text-sm text-muted-foreground mt-1">{subOption.description}</p>
                              )}
                            </div>
                            {selectedSubOption === subOption.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* SR Identifier if needed */}
            {selectedSubOption && selectedSubOptionObj?.name === 'Service Request (SR)' && (
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Service Request Details</h3>
                  <p className="text-muted-foreground">Enter your Service Request identifier</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="srIdentifier" className="text-base font-semibold">
                    Service Request Identifier *
                  </Label>
                  <Input
                    id="srIdentifier"
                    placeholder="Enter SR number (e.g., SR123456789)"
                    value={srIdentifier}
                    onChange={(e) => setSrIdentifier(e.target.value)}
                  />
                  {validatingSrIdentifier && (
                    <p className="text-sm text-muted-foreground">Validating...</p>
                  )}
                  {srIdentifier && srValidationResult && (
                    <p className={`text-sm ${srValidationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {srValidationResult.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Details
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-8">
              {/* Enhanced Progress Bar */}
              <div className="bg-muted/30 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
                {/* Step indicators with connecting line */}
                <div className="flex items-center justify-between mb-4 overflow-x-auto">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                      <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                        <div className="flex flex-col items-center relative">
                          {/* Step Circle */}
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive 
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 scale-110' 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3 h-3 sm:w-6 sm:h-6" />
                            ) : (
                              <StepIcon className="w-3 h-3 sm:w-6 sm:h-6" />
                            )}
                          </div>
                          
                          {/* Step Label */}
                          <div className="mt-2 sm:mt-3 text-center max-w-[60px] sm:max-w-none">
                            <p className={`text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              <span className="hidden sm:inline">{step.title}</span>
                              <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 sm:mx-4 mt-3 sm:mt-6 relative min-w-[20px] sm:min-w-[40px]">
                            <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full' : 'bg-transparent w-0'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      Step {currentStep + 1} of {STEPS.length} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Step Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Request Details</h2>
                  <p className="text-muted-foreground">Provide details about your support request</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Priority Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Priority Level</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {priorityOptions.map(priority => (
                    <Card 
                      key={priority.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPriority === priority.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPriority(priority.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{priority.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold">{priority.name}</h3>
                          </div>
                          {selectedPriority === priority.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
                />
              </div>


            </div>
          </div>
        );

      case 3: // Consultant Selection
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-8">
              {/* Enhanced Progress Bar */}
              <div className="bg-muted/30 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
                {/* Step indicators with connecting line */}
                <div className="flex items-center justify-between mb-4 overflow-x-auto">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                      <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                        <div className="flex flex-col items-center relative">
                          {/* Step Circle */}
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-110' 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3 h-3 sm:w-6 sm:h-6" />
                            ) : (
                              <StepIcon className="w-3 h-3 sm:w-6 sm:h-6" />
                            )}
                          </div>
                          
                          {/* Step Label */}
                          <div className="mt-2 sm:mt-3 text-center max-w-[60px] sm:max-w-none">
                            <p className={`text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              <span className="hidden sm:inline">{step.title}</span>
                              <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 sm:mx-4 mt-3 sm:mt-6 relative min-w-[20px] sm:min-w-[40px]">
                            <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full' : 'bg-transparent w-0'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      Step {currentStep + 1} of {STEPS.length} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Step Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Choose Consultant & Time</h2>
                  <p className="text-muted-foreground">Select a consultant and available time slot</p>
                </div>
              </div>
            </div>

            {/* Priority Selection - Quick Selector */}
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div className=" from-orange-100 to-orange-200 border border-orange-300 rounded-lg p-4">
                  <Label className="text-base font-semibold flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span>Set Priority Level *</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {priorityOptions.map(priority => {
                      const isSelected = selectedPriority === priority.id;
                      return (
                        <Card
                          key={priority.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${
                            isSelected 
                              ? 'ring-2 ring-orange-500 border-orange-300 shadow-lg' 
                              : 'hover:border-orange-200 bg-card'
                          }`}
                          style={isSelected ? {
                            background: 'linear-gradient(135deg, rgb(254 215 170) 0%, rgb(251 191 36) 100%) !important',
                            backgroundColor: 'rgb(254 215 170) !important'
                          } : {
                            backgroundColor: 'hsl(var(--card))'
                          }}
                          onClick={() => setSelectedPriority(priority.id)}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="space-y-2">
                              <span className="text-lg">{priority.icon}</span>
                              <h4 className={`text-sm font-medium ${
                                isSelected ? 'text-orange-800' : 'text-foreground'
                              }`}>
                                {priority.name}
                              </h4>
                              {isSelected && (
                                <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Consultant Selection - Enhanced */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Choose a consultant for your support request *</span>
                </Label>
                
                {consultantsLoading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-muted/30 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : consultants && consultants.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {consultants.map((consultant: any) => {
                      const isSelected = selectedConsultant === consultant.id;
                      const showReviews = consultantShowingReviews === consultant.id;
                      
                      return (
                        <Card
                          key={consultant.id}
                          className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                            isSelected 
                              ? 'ring-2 ring-purple-500 border-purple-300 shadow-lg' 
                              : 'hover:border-purple-200 bg-card'
                          }`}
                          style={isSelected ? {
                            background: 'linear-gradient(135deg, rgb(243 232 255) 0%, rgb(221 214 254) 100%) !important',
                            backgroundColor: 'rgb(243 232 255) !important'
                          } : {
                            backgroundColor: 'hsl(var(--card))'
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header - Consultant Info */}
                              <div 
                                className="flex items-start space-x-3 cursor-pointer"
                                onClick={() => setSelectedConsultant(consultant.id)}
                              >
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-sm relative ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                }`}>
                                  {consultant.firstName?.[0]}{consultant.lastName?.[0]}
                                  {consultant.status === 'available' && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                  )}
                                </div>
                                
                                {/* Consultant Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className={`font-medium text-sm leading-tight ${
                                        isSelected ? 'text-purple-800' : 'text-foreground'
                                      }`}>
                                        {consultant.firstName} {consultant.lastName}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {consultant.role || 'SAP Consultant'}
                                      </p>
                                    </div>
                                    
                                    {/* Selection Indicator */}
                                    {isSelected && (
                                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Performance Indicators */}
                                  <div className="flex items-center space-x-3 mt-2">
                                    {/* Rating */}
                                    {consultant.averageRating && consultant.averageRating > 0 ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="flex">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={`w-3 h-3 ${
                                                star <= Math.round(consultant.averageRating) 
                                                  ? 'fill-yellow-400 text-yellow-400' 
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {consultant.averageRating.toFixed(1)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">New</span>
                                    )}
                                    
                                    {/* Response Time */}
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      <span>{consultant.avgResponseTime || '< 1h'}</span>
                                    </div>
                                    
                                    {/* Success Rate */}
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                      <Check className="w-3 h-3" />
                                      <span>{consultant.successRate || '95'}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Status and Actions Bar */}
                              <div className="flex items-center justify-between pt-2 border-t border-muted/30">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={consultant.status === 'available' ? 'default' : 'secondary'} 
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {consultant.status === 'available' ? 'Available Now' : 'Busy'}
                                  </Badge>
                                  
                                  {consultant.totalRatings > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {consultant.totalRatings} reviews
                                    </span>
                                  )}
                                </div>
                                
                                {/* Review Toggle Button */}
                                {consultant.totalRatings > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 px-2 hover:text-purple-600 hover:bg-transparent"
                                    style={{
                                      backgroundColor: 'transparent'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConsultantShowingReviews(showReviews ? null : consultant.id);
                                    }}
                                  >
                                    {showReviews ? 'Hide Reviews' : 'View Reviews'}
                                    <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${
                                      showReviews ? 'rotate-90' : ''
                                    }`} />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Reviews Section - Expandable */}
                              {showReviews && consultant.totalRatings > 0 && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                  <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                                    <h5 className="text-xs font-medium text-muted-foreground">Customer Reviews</h5>
                                    {/* Sample reviews - you can replace with real data */}
                                    {[
                                      { rating: 5, comment: 'Excellent support, resolved my issue quickly!', date: '2 days ago' },
                                      { rating: 4, comment: 'Very knowledgeable and professional.', date: '1 week ago' },
                                      { rating: 5, comment: 'Great experience, highly recommended.', date: '2 weeks ago' }
                                    ].slice(0, 2).map((review, idx) => (
                                      <div key={idx} className="border-l-2 border-purple-200 pl-2">
                                        <div className="flex items-center space-x-1">
                                          <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`w-2.5 h-2.5 ${
                                                  star <= review.rating 
                                                    ? 'fill-yellow-400 text-yellow-400' 
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-xs text-muted-foreground">{review.date}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          "{review.comment}"
                                        </p>
                                      </div>
                                    ))}
                                    {consultant.totalRatings > 2 && (
                                      <p className="text-xs text-muted-foreground text-center pt-1">
                                        +{consultant.totalRatings - 2} more reviews
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed border-2 border-muted-foreground/20">
                    <CardContent className="p-8 text-center">
                      <User className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h4 className="font-medium text-muted-foreground mb-2">No consultants available</h4>
                      <p className="text-sm text-muted-foreground/70">Please try again later or contact support.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Time Slot Selection - Redesigned */}
              {selectedConsultant && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    <Label className="text-base font-semibold flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Available Time Slots</span>
                    </Label>
                  </div>
                  
                  {loadingSlots ? (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-muted/30 rounded-lg p-3 animate-pulse">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-2/3" />
                            <div className="h-3 bg-muted rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : timeSlots && timeSlots.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {timeSlots.map(slot => {
                        const isSelected = selectedTimeSlot === slot.id;
                        const startTime = new Date(slot.slotStartTime);
                        const endTime = new Date(slot.slotEndTime);
                        const isToday = startTime.toDateString() === new Date().toDateString();
                        const isTomorrow = startTime.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        
                        let dateLabel = startTime.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          weekday: 'short'
                        });
                        if (isToday) dateLabel = 'Today';
                        else if (isTomorrow) dateLabel = 'Tomorrow';
                        
                        return (
                          <Card
                            key={slot.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${
                              isSelected 
                                ? 'ring-2 ring-purple-500 border-purple-200' 
                                : 'hover:border-purple-200 bg-card'
                            }`}
                            style={isSelected ? {
                              background: 'linear-gradient(135deg, rgb(250 245 255) 0%, rgb(243 232 255) 100%) !important',
                              backgroundColor: 'rgb(250 245 255) !important'
                            } : {
                              backgroundColor: 'hsl(var(--card))'
                            }}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {/* Date */}
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${
                                    isSelected ? 'text-purple-900' : 'text-foreground'
                                  }`}>
                                    {dateLabel}
                                  </span>
                                  {isSelected && (
                                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Time */}
                                <div className={`text-xs flex items-center space-x-1 ${
                                  isSelected ? 'text-purple-700' : 'text-muted-foreground'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted-foreground/20">
                      <CardContent className="p-6 text-center">
                        <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <h4 className="font-medium text-muted-foreground mb-2">No time slots available</h4>
                        <p className="text-sm text-muted-foreground/70">This consultant has no available slots at the moment.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-8">
              {/* Enhanced Progress Bar */}
              <div className="bg-muted/30 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
                {/* Step indicators with connecting line */}
                <div className="flex items-center justify-between mb-4 overflow-x-auto">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isUpcoming = index > currentStep;

                    return (
                      <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                        <div className="flex flex-col items-center relative">
                          {/* Step Circle */}
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive 
                              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg shadow-green-500/30 scale-110' 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                : 'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3 h-3 sm:w-6 sm:h-6" />
                            ) : (
                              <StepIcon className="w-3 h-3 sm:w-6 sm:h-6" />
                            )}
                          </div>
                          
                          {/* Step Label */}
                          <div className="mt-2 sm:mt-3 text-center max-w-[60px] sm:max-w-none">
                            <p className={`text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              <span className="hidden sm:inline">{step.title}</span>
                              <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 sm:mx-4 mt-3 sm:mt-6 relative min-w-[20px] sm:min-w-[40px]">
                            <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full' : 'bg-transparent w-0'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      Step {currentStep + 1} of {STEPS.length} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Step Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Review Your Request</h2>
                  <p className="text-muted-foreground">Please review your support request before submitting</p>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Support Type:</span>
                    <span>{selectedSupportTypeObj?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Category:</span>
                    <span>{selectedCategoryObj?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Priority:</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedPriorityObj?.color || 'bg-gray-100 text-gray-800'}`}>
                      <span className="mr-1">{selectedPriorityObj?.icon}</span>
                      <span>{selectedPriorityObj?.name}</span>
                    </div>
                  </div>
                  <div className="py-2 border-b">
                    <span className="font-medium">Description:</span>
                    <div className="mt-2 text-muted-foreground whitespace-pre-wrap break-all overflow-hidden">{description}</div>
                  </div>
                  {srIdentifier && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">SR Identifier:</span>
                      <span>{srIdentifier}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Consultant & Time:</span>
                    <div className="text-right">
                      {selectedConsultantObj ? (
                        <div className="space-y-1">
                          <p className="font-medium">{selectedConsultantObj.firstName} {selectedConsultantObj.lastName}</p>
                          <p className="text-sm text-muted-foreground">{selectedConsultantObj.role || 'SAP Consultant'}</p>
                          {selectedTimeSlotObj && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {new Date(selectedTimeSlotObj.slotStartTime).toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="font-medium text-purple-600">
                                {new Date(selectedTimeSlotObj.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedTimeSlotObj.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p>Consultant ID: {selectedConsultant}</p>
                          <p>Time Slot: {selectedTimeSlot}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Payment note for single-slot v1 */}
                <div className="flex justify-between py-2 border-t">
                  <span className="font-medium">Payment:</span>
                  <span className="text-muted-foreground">
                    {(() => {
                      try {
                        if (!selectedTimeSlotObj || !consultantProfile) {
                          return 'You’ll be asked to pay to confirm this slot';
                        }
                        const start = new Date(selectedTimeSlotObj.slotStartTime).getTime();
                        const end = new Date(selectedTimeSlotObj.slotEndTime).getTime();
                        const minutes = Math.max(0, Math.round((end - start) / 60000));
                        const hours = minutes / 60;
                        const rate = Number(consultantProfile.hourlyRate || 0);
                        if (!rate || hours <= 0) {
                          return 'You’ll be asked to pay to confirm this slot';
                        }
                        const amount = rate * hours;
                        return `You’ll be asked to pay ₹${amount.toFixed(2)} (INR) to confirm this ${minutes} min slot`;
                      } catch {
                        return 'You’ll be asked to pay to confirm this slot';
                      }
                    })()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <PageLayout
      title="Create Support Request"
      description="Submit a new support request with our step-by-step wizard"
      showSidebar={true}
    >
      <div className="max-w-4xl mx-auto px-1 sm:px-4">
        {/* Step Content */}
        <Card>
          <CardContent className="p-2 sm:p-6 lg:p-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>

              <div className="flex gap-2 w-full sm:w-auto">
                {currentStep === STEPS.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={createRequest.isPending}
                    className="w-full sm:w-auto sm:min-w-[120px]"
                  >
                    {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceedToNext()}
                    className="w-full sm:w-auto sm:min-w-[120px]"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Continue</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SupportSelection;
