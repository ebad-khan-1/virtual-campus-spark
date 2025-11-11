import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Users, Star, UserCheck } from "lucide-react";
import { format } from "date-fns";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchEventDetails = async () => {
    setLoading(true);
    
    const { data: eventData, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !eventData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Event not found",
      });
      navigate("/");
      return;
    }

    setEvent(eventData);

    // Fetch organizer details
    const { data: organizerData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", eventData.organizer_id)
      .single();
    
    if (organizerData) {
      setOrganizer(organizerData);
    }

    // Check registration status
    if (user) {
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .eq("student_id", user.id)
        .single();
      
      setIsRegistered(!!regData);

      // Fetch feedback if exists
      const { data: feedbackData } = await supabase
        .from("event_feedback")
        .select("*")
        .eq("event_id", id)
        .eq("student_id", user.id)
        .single();
      
      if (feedbackData) {
        setFeedback(feedbackData);
        setRating(feedbackData.rating);
        setComment(feedbackData.comment || "");
      }
    }

    // Get registration count
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);
    
    setRegistrationCount(count || 0);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: id,
        student_id: user.id,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Registered successfully!",
        description: "You have been registered for this event.",
      });
      fetchEventDetails();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user || !isRegistered) return;

    const feedbackData = {
      event_id: id,
      student_id: user.id,
      rating,
      comment: comment || null,
    };

    const { error } = feedback
      ? await supabase
          .from("event_feedback")
          .update({ rating, comment: comment || null })
          .eq("id", feedback.id)
      : await supabase
          .from("event_feedback")
          .insert(feedbackData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback.",
      });
      fetchEventDetails();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} userRole={userRole} />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const categoryColors: Record<string, string> = {
    academic: "bg-category-academic text-white",
    sports: "bg-category-sports text-white",
    cultural: "bg-category-cultural text-white",
    workshop: "bg-category-workshop text-white",
    seminar: "bg-category-seminar text-white",
    other: "bg-category-other text-white",
  };

  const isFull = registrationCount >= event.capacity;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Event Header */}
          <Card>
            <div className={`h-3 ${categoryColors[event.category]}`} />
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={categoryColors[event.category]}>
                      {event.category}
                    </Badge>
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                </div>
                {user && userRole === "student" && !isRegistered && (
                  <Button
                    onClick={handleRegister}
                    disabled={isFull}
                    size="lg"
                  >
                    {isFull ? "Event Full" : "Register Now"}
                  </Button>
                )}
                {isRegistered && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Registered
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">{event.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>{format(new Date(event.event_date), "MMMM dd, yyyy")}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p>{event.event_time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Venue</p>
                    <p>{event.venue} ({event.venue_type})</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p>{registrationCount} / {event.capacity} registered</p>
                  </div>
                </div>
              </div>

              {organizer && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-1">Organized by</p>
                  <p className="text-muted-foreground">{organizer.full_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Section */}
          {user && isRegistered && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Event Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comments (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSubmitFeedback}>
                  {feedback ? "Update Feedback" : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
