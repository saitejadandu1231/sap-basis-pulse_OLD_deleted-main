import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Trash2, Mail } from "lucide-react";
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
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
          
          // Map backend data to frontend format
          const formattedSlots = Array.isArray(slotsData) ? slotsData.map((slot: any) => ({
            id: slot.id,
            slot_start_time: slot.slotStartTime,
            slot_end_time: slot.slotEndTime,
            booked_by_customer_choice_id: null // Backend uses isBooked flag instead
          })) : [];
          
          setSlots(formattedSlots);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [token, user?.id]);

  const handleDefineBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all date and time fields",
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
          slotEndTime: formatDateForApi(endDate, endTime)
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
        booked_by_customer_choice_id: slot.isBooked ? "some-id" : null // Use isBooked flag from backend
      }));
      
      setSlots(formattedSlots || []);

      // Clear form
      setStartDate("");
      setEndDate("");
      setStartTime("");
      setEndTime("");

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
                Set a time block that will be broken into 1-hour bookable slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDefineBlock} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm font-medium">
                      Start Time
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-sm font-medium">
                      End Time
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-background/50 border-yuktor-300/30 focus:border-yuktor-500 focus:ring-yuktor-500/20"
                      required
                    />
                  </div>
                </div>
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
        <Card className="glass-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Your Availability Slots</span>
            </CardTitle>
            <CardDescription>
              View and manage your current availability slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No availability slots defined yet. Create some using the form above.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm ${
                      slot.booked_by_customer_choice_id
                        ? 'bg-red-500/10 border-red-500/20 text-white'
                        : 'bg-green-500/10 border-green-500/20 text-white'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-white">
                        {new Date(slot.slot_start_time).toLocaleDateString()} 
                        {' '}
                        {new Date(slot.slot_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(slot.slot_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className={`text-sm ${
                        slot.booked_by_customer_choice_id
                          ? 'text-red-300'
                          : 'text-green-300'
                      }`}>
                        {slot.booked_by_customer_choice_id ? 'Booked' : 'Available'}
                      </p>
                    </div>
                    {!slot.booked_by_customer_choice_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </PageLayout>
  );
};

export default ConsultantAvailability;
