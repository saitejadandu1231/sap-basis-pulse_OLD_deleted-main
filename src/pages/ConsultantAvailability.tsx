
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Trash2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AvailabilitySlot {
  id: string;
  slot_start_time: string;
  slot_end_time: string;
  booked_by_customer_choice_id: string | null;
}

const ConsultantAvailability = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, session } = useAuth();
  
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
        // Fetch admin email
        const emailResponse = await fetch(`https://wkmhgfurujsvgckunpgy.supabase.co/functions/v1/calendar-admin-email`);
        const emailData = await emailResponse.json();
        setAdminEmail(emailData.admin_email || 'appadmin@yuktor.com');

        // Fetch consultant slots
        if (session) {
          const slotsResponse = await fetch(`https://wkmhgfurujsvgckunpgy.supabase.co/functions/v1/consultant-availability`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const slotsData = await slotsResponse.json();
          setSlots(slotsData.slots || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [session]);

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
      const response = await fetch(`https://wkmhgfurujsvgckunpgy.supabase.co/functions/v1/consultant-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          startTime,
          endTime,
          slotDurationMinutes: 60
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create availability slots');
      }

      toast({
        title: "Success!",
        description: `Created ${data.slots.length} availability slots`
      });

      // Refresh slots
      const slotsResponse = await fetch(`https://wkmhgfurujsvgckunpgy.supabase.co/functions/v1/consultant-availability`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const slotsData = await slotsResponse.json();
      setSlots(slotsData.slots || []);

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
      const response = await fetch(`https://wkmhgfurujsvgckunpgy.supabase.co/functions/v1/consultant-availability/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete slot');
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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-muted/20 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yuktor-400 to-yuktor-600 bg-clip-text text-transparent">
              Availability Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your consulting availability slots
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-background/50"
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
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      slot.booked_by_customer_choice_id
                        ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(slot.slot_start_time).toLocaleDateString()} 
                        {' '}
                        {new Date(slot.slot_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(slot.slot_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className={`text-sm ${
                        slot.booked_by_customer_choice_id
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {slot.booked_by_customer_choice_id ? 'Booked' : 'Available'}
                      </p>
                    </div>
                    {!slot.booked_by_customer_choice_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
      </div>
    </div>
  );
};

export default ConsultantAvailability;
