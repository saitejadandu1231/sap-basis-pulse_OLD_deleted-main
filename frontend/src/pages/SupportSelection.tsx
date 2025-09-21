import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ConsultantSelector from '@/components/ConsultantSelector';
import { useAuth } from '@/contexts/AuthContext';
import { 
    useSupportTypes, 
    useSupportCategories, 
    useSupportSubOptions, 
    useConsultantAvailabilitySlots,
    useAvailableTimeSlots, 
    useCreateSupportRequest 
} from '@/hooks/useSupport';
import { useValidateServiceRequestIdentifier } from '@/hooks/useServiceRequestIdentifier';

const priorityOptions = [
    { id: 'Low', name: 'Low' },
    { id: 'Medium', name: 'Medium' },
    { id: 'High', name: 'High' },
    { id: 'VeryHigh', name: 'Very High' },
];

const SupportSelection = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  const [selectedSupport, setSelectedSupport] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubOption, setSelectedSubOption] = useState('');
  const [description, setDescription] = useState('');
  const [srIdentifier, setSrIdentifier] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(''); // UAT Fix: Remove default priority
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  
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
  
  // --- TypeScript Error Fix & Conditional Hook Call Logic ---
  // Call hooks only when their dependency ID is available.
  // The hooks themselves should ideally handle a null/undefined ID by not fetching.
  // If they don't, this pattern helps prevent errors.
  const { data: supportSubOptionsData, isLoading: loadingSubOptions } = useSupportSubOptions(selectedSupport || undefined);
  const supportSubOptions = useMemo(() => selectedSupport ? supportSubOptionsData : [], [selectedSupport, supportSubOptionsData]);

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
  // --- End TypeScript Error Fix ---


  const createRequest = useCreateSupportRequest();

  const selectedSupportTypeObj = supportTypes?.find(type => type.id === selectedSupport);
  const selectedCategoryObj = supportCategories?.find(cat => cat.id === selectedCategory);
  const selectedSubOptionObj = supportSubOptions?.find(option => option.id === selectedSubOption);
  const selectedPriorityObj = priorityOptions.find(p => p.id === selectedPriority);

  const resetDependentStates = (level: 'support' | 'category' | 'subOption' | 'priority') => {
    if (level === 'support') {
      setSelectedCategory('');
    }
    if (level === 'support' || level === 'category') {
      setSelectedSubOption('');
      setSrIdentifier('');
      // setSelectedPriority(''); // Priority is independent of category/support type for now
      // setDescription(''); 
    }
    // Only reset consultant and slot for support structure changes, not description changes
    if (level === 'support' || level === 'category' || level === 'subOption') {
      setSelectedConsultant('');
      setSelectedTimeSlot('');
    }
  };

  const handleSupportTypeChange = (value: string) => {
    setSelectedSupport(value);
    resetDependentStates('support');
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    resetDependentStates('category');
  };

  const handleSubOptionChange = (value: string) => {
    setSelectedSubOption(value);
    setSrIdentifier(''); 
    resetDependentStates('subOption');
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    // Priority changes should not reset consultant and time slot selections
  };
  
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    // Description changes should not affect other form selections
  };

  // The requiresSrIdentifier property may not exist yet in the API response
  // So we check if the property exists, and if not, we default based on the name
  const needsSrIdentifier = 
    (selectedSubOptionObj?.requiresSrIdentifier !== undefined ? 
      selectedSubOptionObj?.requiresSrIdentifier : 
      selectedSubOptionObj?.name === 'Service Request (SR)') && 
    (selectedSupportTypeObj?.name === 'SAP RISE' || selectedSupportTypeObj?.name === 'SAP Grow');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // UAT Fix: selectedPriority is now required as it has no default
    if (!selectedSupport || !selectedCategory || !description.trim() || !selectedPriority || !selectedConsultant || !selectedTimeSlot) {
      toast.error('Please fill in all required fields, including priority, consultant, and time slot.');
      return;
    }
    if (needsSrIdentifier) {
      if (!srIdentifier.trim()) {
        toast.error('SR Identifier is required for this request type and support combination.');
        return;
      }
      if (!srValidationResult?.isValid) {
        toast.error('Please enter a valid SR Identifier.');
        return;
      }
    }
    try {
      await createRequest.mutateAsync({
        supportTypeId: selectedSupport,
        supportCategoryId: selectedCategory,
        supportSubOptionId: selectedSubOption || undefined,
        description,
        srIdentifier: needsSrIdentifier ? srIdentifier.trim() : undefined,
        priority: selectedPriority,
        consultantId: selectedConsultant,
        timeSlotId: selectedTimeSlot
      });
      toast.success('Support request created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating support request:', error);
      toast.error(error?.message || 'Failed to create support request');
    }
  };

  const isFormValid = () => {
    // UAT Fix: selectedPriority is now part of base validation
    const baseValid = selectedSupport && selectedCategory && description.trim() && selectedPriority && selectedConsultant && selectedTimeSlot;
    if (needsSrIdentifier) {
      return baseValid && srIdentifier.trim() && srValidationResult?.isValid === true;
    }
    return baseValid;
  };

  const formatTimeSlot = (startTime: string, endTime: string): string => { // Added return type for clarity
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })} - ${end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  if (userRole === 'consultant') return null;

  // --- JSX Rendering ---
  // To fix TS2322, ensure all conditional rendering paths return a valid ReactNode or null.
  // The structure below should be fine. The error might have been from a temporary state during my previous refactoring.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="bg-gray-800">
              <CardTitle className="text-2xl font-bold text-center text-yellow-500">Create Support Request</CardTitle>
            </CardHeader>
            <CardContent className="bg-gray-800 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- Support Type --- */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-white">Support Type</Label>
                  {loadingTypes ? <div className="text-sm text-gray-400">Loading...</div> : 
                    !selectedSupport ? (
                      <RadioGroup value={selectedSupport} onValueChange={handleSupportTypeChange}>
                        {supportTypes?.map(type => (
                          <div key={type.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
                            <RadioGroupItem value={type.id} id={`type-${type.id}`} />
                            <Label htmlFor={`type-${type.id}`} className="cursor-pointer text-gray-200">{type.name}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="p-3 bg-gray-700 rounded-md">
                        <p className="text-gray-200 font-semibold">{selectedSupportTypeObj?.name}</p>
                        <Button variant="link" size="sm" onClick={() => handleSupportTypeChange('')} className="text-yellow-500 p-0 h-auto mt-1">Change</Button>
                      </div>
                    )
                  }
                </div>

                {/* --- Category --- */}
                {selectedSupport && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-white">Category</Label>
                    {loadingCategories ? <div className="text-sm text-gray-400">Loading...</div> :
                      !selectedCategory ? (
                        <RadioGroup value={selectedCategory} onValueChange={handleCategoryChange}>
                          {(supportCategories || [])?.map(category => ( // Added fallback to empty array
                            <div key={category.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
                              <RadioGroupItem value={category.id} id={`cat-${category.id}`} />
                              <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-gray-200">{category.name}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="p-3 bg-gray-700 rounded-md">
                          <p className="text-gray-200 font-semibold">{selectedCategoryObj?.name}</p>
                          <Button variant="link" size="sm" onClick={() => handleCategoryChange('')} className="text-yellow-500 p-0 h-auto mt-1">Change</Button>
                        </div>
                      )
                    }
                  </div>
                )}

                {/* --- Request Type (Sub-options) --- */}
                {/* UAT Issue 1 Fix: Ensure this section shows if sub-options are available for ANY selected support type */}
                {selectedCategory && supportSubOptions && supportSubOptions.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-white">Request Type</Label>
                    {loadingSubOptions ? <div className="text-sm text-gray-400">Loading...</div> :
                      !selectedSubOption ? (
                        <RadioGroup value={selectedSubOption} onValueChange={handleSubOptionChange}>
                          {supportSubOptions.map(option => ( // No ?. here, already checked supportSubOptions
                            <div key={option.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
                              <RadioGroupItem value={option.id} id={`subopt-${option.id}`} />
                              <Label htmlFor={`subopt-${option.id}`} className="cursor-pointer text-gray-200">{option.name}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="p-3 bg-gray-700 rounded-md">
                            <p className="text-gray-200 font-semibold">{selectedSubOptionObj?.name}</p>
                            <Button variant="link" size="sm" onClick={() => handleSubOptionChange('')} className="text-yellow-500 p-0 h-auto mt-1">Change</Button>
                        </div>
                      )
                    }
                  </div>
                )}
                
                {/* --- SR Identifier --- */}
                {selectedSubOption && needsSrIdentifier && (
                  <div className="space-y-2">
                    <Label htmlFor="sr-identifier" className="text-sm font-medium text-white">
                      SR Identifier <span className="text-red-500">*</span>
                    </Label>
                    <Input id="sr-identifier" 
                           value={srIdentifier} 
                           onChange={e => setSrIdentifier(e.target.value)} 
                           className={`w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-500 focus:border-yellow-500 ${srIdentifier && srValidationResult && !srValidationResult.isValid ? 'border-red-500' : ''}`}
                           placeholder="Enter SR Identifier"
                    />
                    {validatingSrIdentifier && srIdentifier && (
                      <div className="text-xs text-yellow-500">Validating identifier...</div>
                    )}
                    {!validatingSrIdentifier && srIdentifier && srValidationResult && (
                      <div className={`text-xs ${srValidationResult.isValid ? 'text-green-500' : 'text-red-500'}`}>
                        {srValidationResult.message}
                      </div>
                    )}
                    {!validatingSrIdentifier && srIdentifier && srValidationResult?.isValid && srValidationResult.taskDescription && (
                      <div className="text-xs text-gray-400 mt-1">
                        Task: {srValidationResult.taskDescription}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Priority --- */}
                {selectedCategory && ( 
                    <div className="space-y-3">
                        <Label className="text-base font-medium text-white">Priority</Label>
                        {!selectedPriority ? ( // UAT Fix: Show options if no priority selected
                            <RadioGroup value={selectedPriority} onValueChange={handlePriorityChange}>
                                {priorityOptions.map(prio => (
                                    <div key={prio.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
                                        <RadioGroupItem value={prio.id} id={`prio-${prio.id}`} />
                                        <Label htmlFor={`prio-${prio.id}`} className="cursor-pointer text-gray-200">{prio.name}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <div className="p-3 bg-gray-700 rounded-md">
                                <p className="text-gray-200 font-semibold">{selectedPriorityObj?.name}</p>
                                <Button variant="link" size="sm" onClick={() => handlePriorityChange('')} className="text-yellow-500 p-0 h-auto mt-1">Change</Button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Description --- */}
                {selectedPriority && ( // Show description after priority is selected
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium text-white">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea 
                        id="description" 
                        value={description} 
                        onChange={e => handleDescriptionChange(e.target.value)}
                        maxLength={1000}
                        className="min-h-[100px] resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Describe your support request..."
                    />
                    <div className="text-sm text-gray-400 text-right">{description.length}/1000</div>
                  </div>
                )}

                {/* --- Consultant Selection --- */}
                {selectedPriority && (
                  <div className="space-y-4">
                    <div className="border-t border-gray-700 pt-6">
                      <Label className="text-base font-medium text-white">Choose a Consultant</Label>
                      <ConsultantSelector onConsultantSelect={setSelectedConsultant} selectedConsultant={selectedConsultant} />
                    </div>
                  </div>
                )}

                {/* --- Consultant Calendar --- */}
                {selectedConsultant && (
                  <div className="space-y-4">
                    <div className="border-t border-gray-700 pt-6">
                      <Label className="text-base font-medium text-white">Available Time Slots</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {loadingSlots ? <div className="text-sm text-gray-400">Loading...</div> : 
                          timeSlots && timeSlots.length > 0 ? (
                            <RadioGroup value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                              {timeSlots.map(slot => (
                                <div key={slot.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700">
                                  <RadioGroupItem value={slot.id} id={`slot-${slot.id}`} />
                                  <Label htmlFor={`slot-${slot.id}`} className="cursor-pointer text-gray-200">
                                    {formatTimeSlot(slot.slotStartTime, slot.slotEndTime)}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : (
                            <div className="text-sm text-gray-400 p-4 bg-gray-700 rounded-md">
                              No available time slots for this consultant.
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Submit Button --- */}
                <div className="pt-6">
                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900" disabled={!isFormValid() || createRequest.isPending}>
                    {createRequest.isPending ? 'Creating...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportSelection;