import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = 'http://localhost:3000/api';

export function EditableEventForm({ scrape, onRefresh, onClose }: { scrape: any, onRefresh: () => void, onClose: () => void }) {
    const originalPayload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
    const ev = originalPayload.mappedEventData || {};
    
    const [isSaving, setIsSaving] = useState(false);
    
    // Event Form State
    const [title, setTitle] = useState(ev.title || '');
    const [description, setDescription] = useState(ev.description || '');
    const [date, setDate] = useState(ev.date || '');
    const [startTime, setStartTime] = useState(ev.startTime || '');
    const [endDate, setEndDate] = useState(ev.endDate || '');
    const [endTime, setEndTime] = useState(ev.endTime || '');
    const [location, setLocation] = useState(ev.location || '');
    const [city, setCity] = useState(ev.city || '');
    const [price, setPrice] = useState(ev.price || '');
    const [eventType, setEventType] = useState(ev.eventType || 'offline');
    const [timezoneOffset, setTimezoneOffset] = useState(ev.timezoneOffset || '+05:30');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPayload = {
                ...originalPayload,
                eventTitle: title,
                finalLocation: location,
                fullStartTimestamp: `${date}T${startTime.split(':').slice(0,2).join(':')}:00.000${timezoneOffset}`,
                contactInfo: {
                    ...(originalPayload.contactInfo || {}),
                    city: city
                },
                mappedEventData: {
                    ...originalPayload.mappedEventData,
                    title,
                    description,
                    date,
                    startTime,
                    endDate,
                    endTime,
                    location,
                    city,
                    price,
                    eventType,
                    timezoneOffset
                }
            };

            const res = await fetch(`${API_BASE}/pending-scrapes/${scrape.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: updatedPayload })
            });

            if (res.ok) {
                onRefresh();
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
                <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-600"/> Edit Event Details
                    </DialogTitle>
                    </DialogHeader>
                
                <div className="p-6 space-y-8 bg-slate-50/50 overflow-y-auto flex-1">
                    {/* Basic Info */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">Event Basics</h3>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Event Title</label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                            <textarea 
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                                <Input value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
                                <Select value={eventType} onValueChange={setEventType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Event Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="offline">Offline / In-person</SelectItem>
                                        <SelectItem value="live">Online / Live Stream</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">Date & Time</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Start Time (24h)</label>
                                <Input type="time" step="1" value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">End Time (24h)</label>
                                <Input type="time" step="1" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-muted-foreground mb-1 block">Timezone Offset</label>
                             <Input value={timezoneOffset} onChange={e => setTimezoneOffset(e.target.value)} placeholder="+05:30" />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</h3>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Venue / Full Address</label>
                            <Input value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Clean City Name</label>
                            <Input value={city} onChange={e => setCity(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSaving ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : null}
                        Save Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
