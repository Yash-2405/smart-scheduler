import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { toast } from "./components/ui/use-toast";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const CalendarView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [rawEventDocs, setRawEventDocs] = useState([]); // to track original event doc IDs

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    const q = query(collection(db, "events"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    const formattedEvents = [];
    const docsMap = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const start = new Date(`${data.date}T${data.startTime}`);
      const end = new Date(`${data.date}T${data.endTime}`);
      formattedEvents.push({
        id: docSnap.id,
        title: data.title,
        start,
        end,
      });
      docsMap.push({
        id: docSnap.id,
        original: data,
      });
    });

    setEvents(formattedEvents);
    setRawEventDocs(docsMap);
  };

  const moveEvent = async ({ event, start, end }) => {
    try {
      const eventRef = doc(db, "events", event.id);
      const newDate = moment(start).format("YYYY-MM-DD");
      const newStart = moment(start).format("HH:mm");
      const newEnd = moment(end).format("HH:mm");

      await updateDoc(eventRef, {
        date: newDate,
        startTime: newStart,
        endTime: newEnd,
      });

      toast({
        title: "✅ Event rescheduled",
        description: `${event.title} → ${newDate} (${newStart}–${newEnd})`,
      });

      fetchEvents();
    } catch (error) {
      toast({ title: "❌ Failed to move event." });
      console.error("Error updating event:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-200 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Your Calendar</h2>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drag & Drop Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <DndProvider backend={HTML5Backend}>
            <div style={{ height: "75vh" }}>
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.WEEK}
                views={["week", "day", "agenda", "month"]}
                step={30}
                timeslots={2}
                draggableAccessor={() => true}
                onEventDrop={moveEvent}
                resizable
                onEventResize={moveEvent}
                style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                }}
              />
            </div>
          </DndProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
