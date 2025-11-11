import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "@/components/EventCard";
import { Calendar, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchStudentEvents();
  }, [user]);

  const fetchStudentEvents = async () => {
    setLoading(true);

    // Fetch registered events
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select(`
        *,
        events (*)
      `)
      .eq("student_id", user.id)
      .order("registered_at", { ascending: false });

    if (registrations) {
      const upcoming = registrations
        .filter((reg: any) => reg.events.status === "upcoming")
        .map((reg: any) => reg.events);
      
      const past = registrations
        .filter((reg: any) => reg.events.status === "completed")
        .map((reg: any) => reg.events);

      setRegisteredEvents(upcoming);
      setPastEvents(past);

      // Fetch registration counts
      const allEvents = [...upcoming, ...past];
      const counts: Record<string, number> = {};
      for (const event of allEvents) {
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        counts[event.id] = count || 0;
      }
      setRegistrationCounts(counts);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Manage your event registrations and view your history</p>
      </div>

      <Tabs defaultValue="registered" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="registered" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Registered Events
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Past Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : registeredEvents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Registered Events</CardTitle>
                <CardDescription>
                  You haven't registered for any upcoming events yet. Browse events to get started!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  registrationCount={registrationCounts[event.id]}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : pastEvents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Past Events</CardTitle>
                <CardDescription>
                  Your event history will appear here once you've attended events.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  registrationCount={registrationCounts[event.id]}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
