import React, { useEffect, useState } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [newName, setNewName] = useState("");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, "events"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => {
        const aTime = `${a.date} ${a.startTime}`;
        const bTime = `${b.date} ${b.startTime}`;
        return new Date(aTime) - new Date(bTime);
      });
      setEvents(items);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAddEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      toast({ title: "⚠️ Please fill in all fields." });
      return;
    }

    try {
      await addDoc(collection(db, "events"), {
        uid: user.uid,
        title,
        date,
        startTime,
        endTime,
      });

      toast({
        title: "✅ Event added successfully!",
        description: `"${title}" on ${date} (${startTime} - ${endTime})`,
      });

      scheduleReminder(title, date, startTime);

      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
      toast({ title: "❌ Failed to add event." });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "❌ Failed to delete event." });
    }
  };

  const handleNameChange = async () => {
    if (!newName.trim()) {
      toast({ title: "⚠️ Please enter a valid name." });
      return;
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: newName,
      });
      toast({ title: "✅ Name updated successfully!" });
      setNewName("");
      window.location.reload();
    } catch (error) {
      console.error("Name update error:", error);
      toast({ title: "❌ Failed to update name." });
    }
  };

  const suggestTimeSlot = () => {
    const dayStart = 9 * 60;
    const dayEnd = 18 * 60;
    const required = duration || 60;

    const currentEvents = events
      .filter((e) => e.date === date)
      .map((e) => ({
        start: convertToMinutes(e.startTime),
        end: convertToMinutes(e.endTime),
      }));

    currentEvents.sort((a, b) => a.start - b.start);

    let prevEnd = dayStart;

    for (let i = 0; i <= currentEvents.length; i++) {
      const nextStart = i === currentEvents.length ? dayEnd : currentEvents[i].start;
      if (nextStart - prevEnd >= required) {
        setStartTime(formatTime(prevEnd));
        setEndTime(formatTime(prevEnd + required));
        return;
      }
      prevEnd = i === currentEvents.length ? prevEnd : Math.max(prevEnd, currentEvents[i].end);
    }

    toast({ title: "⚠️ No free slot found for the selected duration." });
  };

  const convertToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const scheduleReminder = (title, date, time) => {
    const eventTime = new Date(`${date}T${time}`);
    const reminderTime = new Date(eventTime.getTime() - 10 * 60000);
    const now = new Date();

    if (reminderTime > now) {
      const delay = reminderTime - now;
      setTimeout(() => {
        showNotification(`⏰ Reminder: "${title}" starts in 10 minutes.`);
      }, delay);
    }
  };

  const showNotification = (message) => {
    if (Notification.permission === "granted") {
      new Notification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(message);
        }
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-green-50 to-green-200 space-y-6">
      <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Welcome, {user?.displayName || user?.email} 👋
          </h1>
          <div className="flex gap-2">
            <Input
              placeholder="Change your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button onClick={handleNameChange} variant="secondary">
              Update
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/calendar")} variant="outline">
            View Calendar
          </Button>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Add Event</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" placeholder="Duration (min)" min="15" max="240" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <div className="col-span-full flex gap-3">
            <Button onClick={handleAddEvent}>Add Event</Button>
            <Button onClick={suggestTimeSlot} variant="outline">
              Suggest Free Slot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p>No events yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex justify-between items-center border p-3 rounded-md bg-gray-50">
                <div>
                  <strong>{event.title}</strong> — {event.date} ({event.startTime} - {event.endTime})
                </div>
                <Button variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                  Delete
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
