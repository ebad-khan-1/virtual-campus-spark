import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    event_date: string;
    event_time: string;
    venue: string;
    venue_type: string;
    capacity: number;
    status: string;
    organizer_id: string;
  };
  registrationCount?: number;
}

const categoryColors: Record<string, string> = {
  academic: "bg-category-academic text-white",
  sports: "bg-category-sports text-white",
  cultural: "bg-category-cultural text-white",
  workshop: "bg-category-workshop text-white",
  seminar: "bg-category-seminar text-white",
  other: "bg-category-other text-white",
};

const EventCard = ({ event, registrationCount = 0 }: EventCardProps) => {
  const categoryColor = categoryColors[event.category] || categoryColors.other;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
      <div className={`h-2 ${categoryColor}`} />
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition">
            {event.title}
          </h3>
          <Badge className={categoryColor} variant="secondary">
            {event.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{format(new Date(event.event_date), "MMM dd, yyyy")}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>{event.event_time}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="line-clamp-1">{event.venue}</span>
          <Badge variant="outline" className="text-xs">
            {event.venue_type}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span>
            {registrationCount} / {event.capacity} registered
          </span>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/events/${event.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
