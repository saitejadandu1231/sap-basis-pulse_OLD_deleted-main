import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Trash2, Mail, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageLayout from "@/components/layout/PageLayout";

interface AvailabilitySlot {
  id: string;
  slot_start_time: string;
  slot_end_time: string;
  booked_by_customer_choice_id: string | null;
}

// Helper functions for date/time formatting
const formatDateForApi = (dateString: string, timeString: string): string => {
  // Create a Date object and convert to UTC ISO string
  const localDate = new Date(`${dateString}T${timeString}:00`);
  return localDate.toISOString();
};

const ConsultantAvailability = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, token } = useAuth();
  
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [numberOfHours, setNumberOfHours] = useState(1);
  const [calculatedEndDate, setCalculatedEndDate] = useState("");
  const [calculatedEndTime, setCalculatedEndTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showPastDays, setShowPastDays] = useState(false);

  // Helper function to group slots by date
  const groupSlotsByDate = (slots: AvailabilitySlot[]) => {
    const grouped: { [key: string]: AvailabilitySlot[] } = {};
    
    slots.forEach(slot => {
      const dateKey = new Date(slot.slot_start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    
    return grouped;
  };

  // Helper function to toggle expanded day
  const toggleDayExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDays(newExpanded);
  };

  // Helper function to get day display info
  const getDayInfo = (dateKey: string, daySlots: AvailabilitySlot[]) => {
    const date = new Date(dateKey);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let displayDate: string;
    if (date.toDateString() === today.toDateString()) {
      displayDate = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      displayDate = 'Tomorrow';
    } else {
      displayDate = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
    
    const totalSlots = daySlots.length;
    const expiredSlots = daySlots.filter(slot => new Date(slot.slot_end_time) <= today).length;
    const activeSlots = totalSlots - expiredSlots;
    const activeDaySlots = daySlots.filter(slot => new Date(slot.slot_end_time) > today);
    const bookedSlots = activeDaySlots.filter(slot => slot.booked_by_customer_choice_id !== null).length;
    const availableSlots = activeSlots - bookedSlots;
    
    return { displayDate, totalSlots, availableSlots, bookedSlots, expiredSlots, date };
  };

  // Helper function to get overall slot statistics
  const getOverallSlotStats = (slots: AvailabilitySlot[]) => {
    const now = new Date();
    const totalSlots = slots.length;
    const expiredSlots = slots.filter(slot => new Date(slot.slot_end_time) <= now).length;
    const activeSlots = totalSlots - expiredSlots;
    const activeSlotList = slots.filter(slot => new Date(slot.slot_end_time) > now);
    const bookedSlots = activeSlotList.filter(slot => slot.booked_by_customer_choice_id !== null).length;
    const availableSlots = activeSlots - bookedSlots;

    return { totalSlots, expiredSlots, activeSlots, bookedSlots, availableSlots };
  };

  // Redirect if not consultant
  useEffect(() => {
    if (userRole && userRole !== 'consultant') {
      navigate('/dashboard');
      return;
    }
  }, [userRole, navigate]);

  // Fetch admin email and slots
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set default admin email
        setAdminEmail('appadmin@yuktor.com');

        // Fetch consultant slots
        if (user?.id) {
          const slotsResponse = await apiFetch(`ConsultantAvailability/consultant/${user.id}`, {
            method: 'GET'
          });
          const slotsData = await slotsResponse.json();
          
          // Map backend data to frontend format (show all slots including expired)
          const formattedSlots = Array.isArray(slotsData) ? slotsData
            .map((slot: any) => ({
              id: slot.id,
              slot_start_time: slot.slotStartTime,
              slot_end_time: slot.slotEndTime,
              booked_by_customer_choice_id: slot.isBooked ? "booked" : null // Use isBooked flag from backend
            }))
            : [];
          
          setSlots(formattedSlots);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [token, user?.id]);

  // Calculate end date and time when start date/time or hours change
  useEffect(() => {
    if (startDate && startTime && numberOfHours >= 1) {
      // Parse the date and time properly to avoid timezone issues
      const [year, month, day] = startDate.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Create date object using local timezone
      const startDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      const endDateTime = new Date(startDateTime.getTime() + (numberOfHours * 60 * 60 * 1000)); // Add hours in milliseconds
      
      // Format the end date and time
      const endDateStr = endDateTime.getFullYear() + '-' + 
                        String(endDateTime.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(endDateTime.getDate()).padStart(2, '0');
      const endTimeStr = String(endDateTime.getHours()).padStart(2, '0') + ':' + 
                        String(endDateTime.getMinutes()).padStart(2, '0');
      
      setCalculatedEndDate(endDateStr);
      setCalculatedEndTime(endTimeStr);
    } else {
      setCalculatedEndDate("");
      setCalculatedEndTime("");
    }
  }, [startDate, startTime, numberOfHours]);

  const handleDefineBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !startTime || numberOfHours < 1) {
      toast({
        title: "Missing Information",
        description: "Please fill in start date, start time, and select number of hours",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(`ConsultantAvailability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consultantId: user?.id,
          slotStartTime: formatDateForApi(startDate, startTime),
          slotEndTime: formatDateForApi(calculatedEndDate, calculatedEndTime)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create availability slots');
      }

      // Check if we received the new response format with multiple slots
      const createdSlotsCount = data.slots ? data.slots.length : 1;
      
      toast({
        title: "Success!",
        description: `${createdSlotsCount} availability ${createdSlotsCount === 1 ? 'slot' : 'slots'} created successfully`
      });

      // Refresh slots
      const slotsResponse = await apiFetch(`ConsultantAvailability/consultant/${user?.id}`, {
        method: 'GET'
      });
      const slotsData = await slotsResponse.json();
      
      // Map backend data to frontend format
      const formattedSlots = slotsData.map((slot: any) => ({
        id: slot.id,
        slot_start_time: slot.slotStartTime,
        slot_end_time: slot.slotEndTime,
        booked_by_customer_choice_id: slot.isBooked ? "booked" : null // Use isBooked flag from backend
      }));
      
      setSlots(formattedSlots || []);

      // Clear form
      setStartDate("");
      setCalculatedEndDate("");
      setStartTime("");
      setCalculatedEndTime("");
      setNumberOfHours(1);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create availability slots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const response = await apiFetch(`ConsultantAvailability/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });      

      if (!response.ok) {
        // Try to parse error if possible
        let errorMsg = 'Failed to delete slot';
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          // If no JSON body, just use the status text
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      toast({
        title: "Success!",
        description: "Availability slot deleted"
      });

      // Refresh slots
      setSlots(slots.filter(slot => slot.id !== slotId));

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete slot",
        variant: "destructive"
      });
    }
  };

  if (userRole !== 'consultant') {
    return null;
  }

  return (
    <PageLayout
      title="Availability Management"
      description="Manage your consulting availability slots"
      showSidebar={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Define Availability Block */}
        <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Define Availability Block</span>
              </CardTitle>
              <CardDescription>
                Select start date/time and number of hours - the end time will be calculated automatically and broken into 1-hour bookable slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDefineBlock} className="space-y-4">
                {/* Start Date and Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20 pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm font-medium">
                      Start Time
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20 pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Number of Hours Row */}
                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-medium">
                    Number of Hours
                  </Label>
                  <select
                    id="hours"
                    value={numberOfHours}
                    onChange={(e) => setNumberOfHours(parseInt(e.target.value))}
                    className="w-full bg-background/50 border border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20 rounded-md px-3 py-2 h-11"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour}>
                        {hour} hour{hour > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Calculated End Date and Time Row (Read-only display) */}
                {calculatedEndDate && calculatedEndTime && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Calculated End Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          type="date"
                          value={calculatedEndDate}
                          className="bg-muted/50 border-muted-foreground/30 pl-10 h-11 cursor-not-allowed"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Calculated End Time
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          type="time"
                          value={calculatedEndTime}
                          className="bg-muted/50 border-muted-foreground/30 pl-10 h-11 cursor-not-allowed"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full btn-glow bg-yuktor-600 hover:bg-yuktor-700"
                  disabled={loading}
                >
                  {loading ? "Creating Slots..." : "Create Availability Slots"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Mass Update Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Mass Calendar Update</span>
              </CardTitle>
              <CardDescription>
                Need to update multiple availability slots at once?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  For any easy mass update of your calendar availability, please reach out to:
                </p>
                <p className="font-medium text-yuktor-500">
                  {adminEmail}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Availability Slots */}
        <div className="mt-8">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-blue-50/20 to-cyan-50/30 dark:from-emerald-950/10 dark:via-blue-950/5 dark:to-cyan-950/10 rounded-2xl -m-2" />

            <Card className="relative backdrop-blur-xl border-0 shadow-2xl shadow-emerald-500/10 rounded-2xl overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>

              <CardHeader className="relative pb-6 pt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Your Availability Slots
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage your current availability slots
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative px-8 pb-8">
                {/* Overall Statistics */}
                {slots.length > 0 && (
                  <div className="mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {(() => {
                        const { totalSlots, expiredSlots, activeSlots, bookedSlots, availableSlots } = getOverallSlotStats(slots);
                        return (
                          <>
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/30 dark:border-blue-700/30 p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                  <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalSlots}</p>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Slots</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-700/30 p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                                  <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{availableSlots}</p>
                                  <p className="text-sm text-emerald-700 dark:text-emerald-300">Available</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200/30 dark:border-red-700/30 p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                                  <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{bookedSlots}</p>
                                  <p className="text-sm text-red-700 dark:text-red-300">Booked</p>
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border border-gray-200/30 dark:border-gray-700/30 p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-md">
                                  <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{expiredSlots}</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">Expired</p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Past Days Toggle */}
                {slots.length > 0 && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPastDays(!showPastDays)}
                      className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{showPastDays ? 'Hide' : 'Show'} Past Days</span>
                    </Button>
                  </div>
                )}

                {slots.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No availability slots</h3>
                    <p className="text-muted-foreground">
                      No availability slots defined yet. Create some using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const groupedSlots = groupSlotsByDate(slots);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Set to start of today
                      
                      // Filter out past days unless showPastDays is true
                      const filteredGroupedSlots = showPastDays 
                        ? groupedSlots 
                        : Object.fromEntries(
                            Object.entries(groupedSlots).filter(([dateKey]) => {
                              const slotDate = new Date(dateKey);
                              slotDate.setHours(0, 0, 0, 0);
                              return slotDate >= today;
                            })
                          );
                      
                      return Object.entries(filteredGroupedSlots).map(([dateKey, daySlots], dayIndex) => {
                      const { displayDate, availableSlots, totalSlots, bookedSlots, expiredSlots, date } = getDayInfo(dateKey, daySlots);
                      const isExpanded = expandedDays.has(dateKey);
                      const hasAvailableSlots = availableSlots > 0;
                      
                      return (
                        <div key={dateKey} className="space-y-3">
                          {/* Day Card */}
                          <div
                            className="group relative cursor-pointer"
                            style={{ animationDelay: `${dayIndex * 100}ms` }}
                            onClick={() => toggleDayExpansion(dateKey)}
                          >
                            <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl border border-white/20 dark:border-gray-700/30 ${
                              hasAvailableSlots
                                ? 'bg-emerald-50 dark:bg-emerald-950/20'
                                : 'bg-gray-50 dark:bg-gray-950/20'
                            }`}>
                              {/* Gradient background */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${
                                hasAvailableSlots
                                  ? 'from-emerald-500 to-teal-600'
                                  : 'from-gray-500 to-slate-600'
                              } opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                              {/* Animated border */}
                              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${
                                hasAvailableSlots
                                  ? 'from-emerald-500 to-teal-600'
                                  : 'from-gray-500 to-slate-600'
                              } opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px]`}>
                                <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900" />
                              </div>

                              <div className="relative p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${
                                      hasAvailableSlots
                                        ? 'from-emerald-500 to-teal-600'
                                        : 'from-gray-500 to-slate-600'
                                    } flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div>
                                      <h3 className={`font-bold text-base sm:text-lg ${
                                        hasAvailableSlots
                                          ? 'text-emerald-900 dark:text-emerald-100'
                                          : 'text-gray-900 dark:text-gray-100'
                                      } group-hover:scale-105 transition-transform duration-300`}>
                                        {displayDate}
                                      </h3>
                                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        {availableSlots} available, {bookedSlots} booked, {expiredSlots} expired
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Expand/Collapse Icon */}
                                  <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  </div>
                                </div>
                              </div>

                              {/* Hover glow effect */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${
                                hasAvailableSlots
                                  ? 'from-emerald-600 to-teal-700'
                                  : 'from-gray-600 to-slate-700'
                              } opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />
                            </div>
                          </div>

                          {/* Expanded Time Slots */}
                          {isExpanded && (
                            <div className="ml-4 sm:ml-8 space-y-2 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {daySlots.map((slot, slotIndex) => {
                                  const isBooked = slot.booked_by_customer_choice_id !== null;
                                  const isExpired = new Date(slot.slot_end_time) <= new Date();
                                  
                                  return (
                                    <div
                                      key={slot.id}
                                      className="group relative"
                                      style={{ animationDelay: `${slotIndex * 50}ms` }}
                                    >
                                      <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg border border-white/20 dark:border-gray-700/30 ${
                                        isExpired
                                          ? 'bg-gray-50 dark:bg-gray-950/20 opacity-60'
                                          : isBooked
                                          ? 'bg-red-50 dark:bg-red-950/20'
                                          : 'bg-white dark:bg-gray-800'
                                      }`}>
                                        {/* Gradient background */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${
                                          isExpired
                                            ? 'from-gray-500 to-slate-600'
                                            : isBooked
                                            ? 'from-red-500 to-rose-600'
                                            : 'from-emerald-500 to-teal-600'
                                        } opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                        <div className="relative p-3 sm:p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                                                isExpired
                                                  ? 'from-gray-500 to-slate-600'
                                                  : isBooked
                                                  ? 'from-red-500 to-rose-600'
                                                  : 'from-emerald-500 to-teal-600'
                                              } flex items-center justify-center shadow-md`}>
                                                <Clock className="w-4 h-4 text-white" />
                                              </div>
                                              <div>
                                                <p className={`font-medium text-sm ${
                                                  isExpired
                                                    ? 'text-gray-900 dark:text-gray-100'
                                                    : isBooked
                                                    ? 'text-red-900 dark:text-red-100'
                                                    : 'text-emerald-900 dark:text-emerald-100'
                                                }`}>
                                                  {new Date(slot.slot_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.slot_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                  <div className={`w-2 h-2 rounded-full ${
                                                    isExpired
                                                      ? 'bg-gray-500'
                                                      : isBooked
                                                      ? 'bg-red-500'
                                                      : 'bg-emerald-500'
                                                  }`} />
                                                  <span className={`text-xs ${
                                                    isExpired
                                                      ? 'text-gray-700 dark:text-gray-300'
                                                      : isBooked
                                                      ? 'text-red-700 dark:text-red-300'
                                                      : 'text-emerald-700 dark:text-emerald-300'
                                                  }`}>
                                                    {isExpired ? 'Expired' : isBooked ? 'Booked' : 'Available'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {!isBooked && !isExpired && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteSlot(slot.id);
                                                }}
                                                className="opacity-60 group-hover:opacity-100 transition-opacity p-2 h-auto hover:bg-red-500/20"
                                              >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                    })()}
                  </div>
                )}

                {/* Bottom decoration */}
                {slots.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full animate-pulse" />
                      <span>Click on a day to view available slots{!showPastDays && ' (past days hidden)'}</span>
                      <div className="w-1 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </PageLayout>
  );
};

export default ConsultantAvailability;
