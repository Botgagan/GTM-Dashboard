import { EditableOrgForm } from './EditableOrgForm';
import { EditableEventForm } from './EditableEventForm';
import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Edit, Trash, Plus, Link as LinkIcon, Search, Play, Activity, RefreshCw, Users, Calendar, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Format helper to match: "Tue, 22 Sep 2026 • 7:00 PM to Thu, 24 Sep 2026 • 11:00 PM (IST)"
function formatEventDateTimeString(dateStr: string, startTime?: string, endDateStr?: string, endTime?: string, tzOffsetStr?: string) {
  const parseDate = (d: string, t?: string) => {
    try {
      const dt = new Date(`${d}T${t || '00:00:00'}`);
      if (!isNaN(dt.getTime())) return dt;
    } catch(e){}
    return null;
  };
  
  const formatPart = (d: Date, tStr?: string) => {
    let dStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
    dStr = dStr.replace(/^([A-Za-z]+)\s/, '$1, ');
    const timeStr = tStr ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
    return timeStr ? `${dStr} • ${timeStr}` : dStr;
  };

  const sd = parseDate(dateStr, startTime);
  const ed = (endDateStr && endDateStr !== "2026-08-15") ? parseDate(endDateStr, endTime) : null;
  
  let result = "";
  if (sd) {
    result += formatPart(sd, startTime);
  } else {
    result += dateStr + (startTime ? ` • ${startTime}` : '');
  }
  
  if (ed || (endDateStr && endDateStr !== "2026-08-15")) {
    result += " to ";
    if (ed) {
      result += formatPart(ed, endTime);
    } else {
      result += endDateStr + (endTime ? ` • ${endTime}` : '');
    }
  }
  
  // Add Timezone string based on offset (e.g., "-07:00" -> PST, "+05:30" -> IST)
  let tzLabel = "";
  if (tzOffsetStr === "+05:30") tzLabel = "IST";
  else if (tzOffsetStr === "-07:00") tzLabel = "PDT/PST";
  else if (tzOffsetStr === "-08:00") tzLabel = "PST";
  else if (tzOffsetStr === "-04:00") tzLabel = "EDT/EST";
  else if (tzOffsetStr === "-05:00") tzLabel = "EST";
  else if (tzOffsetStr === "+00:00" || tzOffsetStr === "Z") tzLabel = "UTC";
  else if (tzOffsetStr) tzLabel = `UTC${tzOffsetStr}`;
  
  if (tzLabel) {
    result += ` (${tzLabel})`;
  }
  
  return result;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Contact = {
  id: string;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  social: string | null;
  source: string;
  send_enabled: boolean;
  last_contacted_at: string | null;
};

type Event = {
  id: string;
  title: string;
  status: string;
  hind_status: string;
  hind_url: string | null;
  source_url: string | null;
  event_date: string | null;
  end_date: string | null;
  location: string | null;
  sent_on: string | null;
};

type Organization = {
  id: string;
  name: string;
  status: 'claimed' | 'unclaimed' | 'failed' | 'published' | 'unpublished';
  community_name: string;
  created_for: string;
  owner: string;
  members_count: number;
  org_name: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  admin_invite_link: string | null;
  failure_reason: string | null;
  contacts_count: number;
  events_count: number;
  created_at: string;
  last_contacted_at: string | null;
  hind_status: string;
};

const API_BASE = 'http://localhost:3000/api';

function getDomainName(urlStr: string | null): string {
  if (!urlStr) return 'Link';
  try {
    const domain = new URL(urlStr).hostname.replace('www.', '').toLowerCase();
    if (domain.includes('instagram.com')) return 'Instagram';
    if (domain.includes('facebook.com')) return 'Facebook';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'YouTube';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'Twitter';
    if (domain.includes('linkedin.com')) return 'LinkedIn';
    return domain;
  } catch (e) {
    return 'Link';
  }
}

function EditableOrgRow({ org, expandedOrg, toggleExpand, handleSendToInstantly, sendingToInstantly, onRefresh }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(org);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (org.id.startsWith('new-')) {
        await fetch(`${API_BASE}/org`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      } else {
        await fetch(`${API_BASE}/org/${org.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      }
      setIsEditing(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to save organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this organization completely?')) return;
    if (!org.id.startsWith('new-')) {
      await fetch(`${API_BASE}/org/${org.id}`, { method: 'DELETE' });
    }
    onRefresh();
  };

  if (isEditing) {
    return (
      <TableRow className="bg-muted/50 align-top">
        <TableCell className="w-[150px] max-w-[150px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Subcommunity Name" />
        </TableCell>
        <TableCell className="w-[150px] max-w-[150px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.community_name || ''} onChange={e => setEditData({...editData, community_name: e.target.value})} placeholder="Community" />
        </TableCell>
        <TableCell className="w-[120px] max-w-[120px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.created_for || ''} onChange={e => setEditData({...editData, created_for: e.target.value})} placeholder="Created For" />
        </TableCell>
        <TableCell className="w-[100px] max-w-[100px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.owner || ''} onChange={e => setEditData({...editData, owner: e.target.value})} placeholder="Owner" />
        </TableCell>
        <TableCell className="w-[60px] max-w-[60px] overflow-hidden">
          <Input type="number" className="h-8 text-xs w-full min-w-0 text-center" value={editData.members_count || 0} onChange={e => setEditData({...editData, members_count: parseInt(e.target.value)||0})} />
        </TableCell>
        <TableCell>
          <Select value={editData.hind_status === 'published' ? 'published' : 'unpublished'} onValueChange={(v) => setEditData({...editData, hind_status: v})}>
            <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Hind Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="w-[150px] max-w-[150px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.org_name || ''} onChange={e => setEditData({...editData, org_name: e.target.value})} placeholder="Org Name" />
        </TableCell>
        <TableCell className="w-[200px] max-w-[200px] overflow-hidden space-y-1">
           <Input className="h-8 text-xs w-full min-w-0" value={editData.city || ''} onChange={e => setEditData({...editData, city: e.target.value})} placeholder="City" />
           <Input className="h-8 text-xs w-full min-w-0" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} placeholder="Address" />
        </TableCell>
        <TableCell className="w-[150px] max-w-[150px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})} placeholder="Website" />
        </TableCell>
        <TableCell className="w-[150px] max-w-[150px] overflow-hidden">
          <Input className="h-8 text-xs w-full min-w-0" value={editData.admin_invite_link || ''} onChange={e => setEditData({...editData, admin_invite_link: e.target.value})} placeholder="Invite Link" />
        </TableCell>
        <TableCell className="text-center font-medium text-slate-500">{org.contacts_count || 0}</TableCell>
        <TableCell className="text-slate-500 text-[10px]">{org.last_contacted_at ? new Date(org.last_contacted_at).toLocaleDateString() : '-'}</TableCell>
        <TableCell className="text-center font-medium text-slate-500">{org.events_count || 0}</TableCell>
        <TableCell className="text-right align-top">
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={handleSave} disabled={isSaving}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); if(org.id.startsWith('new-')) onRefresh(); }}>Cancel</Button>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <React.Fragment>
      <TableRow className="group align-top">
        <TableCell className="font-semibold text-slate-900 max-w-[150px] truncate select-all cursor-text" title={org.name || ''}>
          <div className="flex items-center gap-2 truncate">
            {org.name}
          </div>
          {org.status === 'failed' && org.failure_reason && (
            <div className="text-destructive text-[10px] mt-1 bg-destructive/10 inline-block px-1.5 py-0.5 rounded border border-destructive/20 truncate max-w-full" title={org.failure_reason}>
              {org.failure_reason}
            </div>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground max-w-[150px] truncate select-all cursor-text" title={org.community_name || ''}>{org.community_name || '-'}</TableCell>
        <TableCell className="text-muted-foreground max-w-[120px] truncate select-all cursor-text" title={org.created_for || ''}>{org.created_for || '-'}</TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-[11px] font-medium max-w-[100px] truncate block" title={org.owner || ''}>{org.owner || '-'}</Badge>
        </TableCell>
        <TableCell className="text-center font-medium">{org.members_count || 0}</TableCell>
        <TableCell>
          <Badge variant={org.hind_status === 'published' ? "default" : "secondary"} className={cn("text-[11px] capitalize", org.hind_status === 'published' ? "bg-green-600 hover:bg-green-700" : "")}>
            {org.hind_status === 'published' ? 'Published' : 'Unpublished'}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground max-w-[150px] truncate select-all cursor-text" title={org.org_name || ''}>{org.org_name || '-'}</TableCell>
        <TableCell className="max-w-[200px]">
          <div className="flex flex-col gap-0.5">
            {org.city && <span className="font-medium text-[11px] truncate select-all cursor-text" title={org.city}>{org.city}</span>}
            {org.address && <span className="text-[10px] text-muted-foreground truncate select-all cursor-text" title={org.address}>{org.address}</span>}
            {!org.city && !org.address && <span>-</span>}
          </div>
        </TableCell>
        <TableCell>
          {org.website ? (
            <a href={org.website} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] break-all flex items-center gap-1">
               <LinkIcon className="w-3 h-3"/> Link
            </a>
          ) : '-'}
        </TableCell>
        <TableCell>
          {org.admin_invite_link ? (
            <div className="flex items-center">
               <span className="text-[11px] text-muted-foreground truncate max-w-[120px] select-all cursor-text" title={org.admin_invite_link}>
                 {org.admin_invite_link}
               </span>
            </div>
          ) : '-'}
        </TableCell>
        <TableCell>
           <div className="flex items-center gap-2">
             <span className="font-semibold">{org.contacts_count || 0}</span>
             <Button 
               variant={expandedOrg?.id === org.id && expandedOrg.type === 'contacts' ? "default" : "outline"}
               size="sm"
               className="h-6 text-[10px] px-2"
               onClick={() => toggleExpand(org.id, 'contacts')}
             >
               View
             </Button>
           </div>
        </TableCell>
        <TableCell>
          {org.last_contacted_at ? (
            <div className="text-[10px] text-muted-foreground">
              {new Date(org.last_contacted_at).toLocaleDateString()}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
             <span className="font-semibold">{org.events_count || 0}</span>
             <Button 
               variant={expandedOrg?.id === org.id && expandedOrg.type === 'events' ? "default" : "outline"}
               size="sm"
               className="h-6 text-[10px] px-2"
               onClick={() => toggleExpand(org.id, 'events')}
             >
               View
             </Button>
           </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="flex flex-col items-end gap-2">
              {org.status !== 'failed' && !org.id.startsWith('new-') && (
                <Button
                  size="sm"
                  variant={org.last_contacted_at ? "secondary" : "default"}
                  onClick={() => handleSendToInstantly(org.id)}
                  disabled={sendingToInstantly === org.id}
                  className={cn("h-7 text-[10px] px-2", org.last_contacted_at && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200")}
                >
                  {sendingToInstantly === org.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <Send className="w-3 h-3 mr-1.5" />
                  )}
                  {org.last_contacted_at ? 'Sent' : 'Instantly'}
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              {/* @ts-ignore */}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function ScrapedEventsPanel({ pendingScrapes, onRefresh }: { pendingScrapes: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source URL</TableHead>
            <TableHead>Org Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingScrapes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                No pending scraped events.
              </TableCell>
            </TableRow>
          ) : (
            pendingScrapes.map(scrape => (
              <PendingEventRow 
                key={scrape.id} 
                scrape={scrape} 
                onRefresh={onRefresh} 
                onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })}
              />
            ))
          )}
        </TableBody>
      </Table>

            {expandedPending !== null && activeScrape && (
        <EditableOrgForm 
          scrape={activeScrape} 
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />
      )}
    </>
  );
}

function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
  const ev = payload.mappedEventData;

  // Determine status
  let eventStatus = 'new';
  if (ev.date && ev.endDate && ev.endDate !== "2026-08-15") {
    const start = new Date(ev.date).getTime();
    const end = new Date(ev.endDate).getTime();
    const now = Date.now();
    if (now > end) eventStatus = 'expired';
    else if (now >= start && now <= end) eventStatus = 'ongoing';
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`${API_BASE}/pending-scrapes/${scrape.id}/approve`, { method: 'POST' });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.error}`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`${API_BASE}/pending-scrapes/${scrape.id}/reject`, { method: 'POST' });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isResolved = scrape.status === 'approved' || scrape.status === 'rejected';

  // Format Dates correctly using JS Date for consistency
  const dateDisplay = formatEventDateTimeString(
     ev.date, 
     ev.startTime, 
     ev.endDate, 
     ev.endTime, 
     payload.mappedEventData.timezoneOffset
  );

  return (
    <TableRow className={cn("bg-white", isResolved && "opacity-60")}>
      <TableCell className="max-w-[200px] group relative">
        <div className="flex items-center gap-2 pr-6">
          <span className="font-medium text-[11px] truncate cursor-text select-all" title={payload.eventTitle}>{payload.eventTitle || 'N/A'}</span>
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
        </div>
        {isEditingEvent && <EditableEventForm scrape={scrape} onRefresh={onRefresh} onClose={() => setIsEditingEvent(false)} />}
      </TableCell>
      <TableCell>
        {isResolved ? (
          <Badge variant={scrape.status === 'approved' ? 'default' : 'destructive'} className="capitalize">
            {scrape.status}
          </Badge>
        ) : (
          <Badge variant="outline" className={
            eventStatus === 'new' ? 'bg-blue-50 text-blue-700' : 
            eventStatus === 'ongoing' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'
          }>
            {eventStatus}
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="font-semibold text-slate-900 text-[11px]">{dateDisplay}</span>
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const loc = payload.finalLocation || 'Online';
           if (loc === 'Online') return <span className="font-medium text-[11px]">Online</span>;
           const parts = loc.split('\n');
           return (
             <div className="flex flex-col gap-0.5">
               <span className="font-semibold text-slate-900 text-[11px]">{parts[0]}</span>
               {parts[1] && <span className="text-[10px] text-muted-foreground leading-tight">{parts[1]}</span>}
             </div>
           );
        })()}
      </TableCell>
      <TableCell>
        <a href={scrape.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] break-all flex items-center gap-1">
          <LinkIcon className="w-3 h-3" /> Link
        </a>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={onViewOrg}>
          View
        </Button>
      </TableCell>
      <TableCell className="text-right align-middle">
        <div className="flex items-center justify-end gap-2">
          {!isResolved ? (
            <>
              <Button size="sm" variant="outline" className="h-7 border-green-200 text-green-700 hover:bg-green-50" onClick={handleApprove} disabled={isApproving}>
                {isApproving ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />} Approve
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleReject} disabled={isApproving}>
                <XCircle className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic font-medium pr-2">
               {scrape.status === 'approved' ? 'Processed' : 'Discarded'}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
function ScrapedUrlsPanel({ setUrlsCount, urlProcessingUI }: { setUrlsCount: (n: number) => void, urlProcessingUI?: React.ReactNode }) {
  const [urls, setUrls] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [sourceTab, setSourceTab] = useState<'cron-job' | 'manual'>('cron-job');
  const [showPlatformManager, setShowPlatformManager] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);

  const fetchUrls = async (f: string) => {
    try {
      const res = await fetch(`${API_BASE}/scraped-urls?filter=${f}`);
      const data = await res.json();
      setUrls(data);
      setUrlsCount(data.length);
    } catch (e) {
      console.error("Failed to fetch URLs", e);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await fetch(`${API_BASE}/platforms`);
      const data = await res.json();
      setPlatforms(data);
    } catch (e) {
      console.error("Failed to fetch platforms", e);
    }
  };

  useEffect(() => {
    fetchUrls(filter);
    fetchPlatforms();
  }, [filter]);

  const togglePlatform = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_BASE}/platforms/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchPlatforms();
    } catch (e) {
      console.error("Failed to toggle platform", e);
    }
  };

  const addPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const domain = (form.elements.namedItem('domain') as HTMLInputElement).value;
    const search_path = (form.elements.namedItem('search_path') as HTMLInputElement).value;
    
    try {
      await fetch(`${API_BASE}/platforms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, search_path })
      });
      fetchPlatforms();
      form.reset();
    } catch (e) {
      console.error("Failed to add platform", e);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceTab === 'cron-job' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setSourceTab('cron-job')}
            >
              Cron-Job Scraping
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceTab === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setSourceTab('manual')}
            >
              Manual Scraping
            </button>
          </div>
          {sourceTab === 'cron-job' && (
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
          )}
        </div>

        {sourceTab === 'cron-job' && (
        <Button variant="outline" onClick={() => setShowPlatformManager(true)} className="flex items-center gap-2">
          <Settings className="w-4 h-4" /> Manage Platforms
        </Button>
        )}
      </div>

      {sourceTab === 'manual' && urlProcessingUI}

      {sourceTab === 'cron-job' && (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Discovered At</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                No scraped URLs found for this timeframe.
              </TableCell>
            </TableRow>
          ) : (
            urls.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-sm">
                  {new Date(u.discovered_at).toLocaleString()}
                </TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{u.source || 'cron-job'}</Badge></TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">{u.platform_name || 'Unknown'}</Badge>
                </TableCell>
                <TableCell>
                  <a href={u.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Link
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === 'success' ? 'default' : u.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                    {u.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      )}

      <Dialog open={showPlatformManager} onOpenChange={setShowPlatformManager}>
        <DialogContent className="!w-[85vw] !max-w-[85vw] !h-[90vh] !max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Manage Scraping Platforms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{p.domain}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? 'default' : 'secondary'}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={p.is_active ? 'outline' : 'default'}
                        onClick={() => togglePlatform(p.id, p.is_active)}
                      >
                        {p.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Add New Platform</h4>
              <form onSubmit={addPlatform} className="flex items-center gap-2">
                <Input name="name" placeholder="Name (e.g. AllEvents)" required className="h-9" />
                <Input name="domain" placeholder="Domain (allevents.in)" required className="h-9" />
                <Input name="search_path" placeholder="Search Path (site:allevents.in/)" required className="h-9" />
                <Button type="submit" size="sm" className="h-9 whitespace-nowrap"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function App() {
  const [globalCityFilter, setGlobalCityFilter] = useState('All');
  const [cities, setCities] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [pendingScrapes, setPendingScrapes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'claimed' | 'unclaimed' | 'failed' | 'urls'>('pending');
  const [expandedOrg, setExpandedOrg] = useState<{ id: string; type: 'contacts' | 'events' } | null>(null);
  const [urlsCount, setUrlsCount] = useState(0);
  const [orgDetails, setOrgDetails] = useState<{ contacts: Contact[]; events: Event[] }>({ contacts: [], events: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingToInstantly, setSendingToInstantly] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  const filteredOrgs = orgs.filter(o => {
    if (o.status !== activeTab) return false;
    return true;
  });

  const fetchCities = async () => {
    try {
      const res = await fetch(`${API_BASE}/cities`);
      const data = await res.json();
      setCities(['All', ...data.filter(Boolean)]);
    } catch (e) { console.error(e); }
  };

  const fetchDashboardData = async () => {
    try {
      const q = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';
      const res = await fetch(`${API_BASE}/dashboard${q}`);
      const data = await res.json();
      setOrgs(data);
      const resPending = await fetch(`${API_BASE}/pending-scrapes${q}`);
      const dataPending = await resPending.json();
      setPendingScrapes(dataPending);

      const q2 = globalCityFilter !== 'All' ? `&city=${encodeURIComponent(globalCityFilter)}` : '';
      const scrapedRes = await fetch(`${API_BASE}/scraped-urls?filter=all${q2}`);
      const scrapedData = await scrapedRes.json();
      setUrlsCount(scrapedData.length);

      // If a panel is currently expanded, quietly refresh its details too!
      if (expandedOrg) {
        if (expandedOrg.type === 'contacts') {
          const resDetails = await fetch(`${API_BASE}/org/${expandedOrg.id}/contacts`);
          const detailsData = await resDetails.json();
          setOrgDetails(prev => ({ ...prev, contacts: detailsData }));
        } else {
          const resDetails = await fetch(`${API_BASE}/org/${expandedOrg.id}/events`);
          const detailsData = await resDetails.json();
          setOrgDetails(prev => ({ ...prev, events: detailsData }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [globalCityFilter]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleProcess = () => {
    if (!url) return;
    setIsProcessing(true);
    setLogs([{ type: 'log', message: 'Starting pipeline...' }]);
    
    const eventSource = new EventSource(`${API_BASE}/scrape?url=${encodeURIComponent(url)}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data]);
      if (data.type === 'done' || data.type === 'error') {
        eventSource.close();
        setIsProcessing(false);
        fetchDashboardData();
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setIsProcessing(false);
      setLogs((prev) => [...prev, { type: 'error', message: 'Connection to server failed or dropped.' }]);
    };
  };

  const toggleExpand = async (orgId: string, type: 'contacts' | 'events') => {
    if (expandedOrg?.id === orgId && expandedOrg.type === type) {
      setExpandedOrg(null);
      return;
    }
    
    setExpandedOrg({ id: orgId, type });
    setLoadingDetails(true);
    
    try {
      if (type === 'contacts') {
        const res = await fetch(`${API_BASE}/org/${orgId}/contacts`);
        const data = await res.json();
        setOrgDetails(prev => ({ ...prev, contacts: data }));
      } else {
        const res = await fetch(`${API_BASE}/org/${orgId}/events`);
        const data = await res.json();
        setOrgDetails(prev => ({ ...prev, events: data }));
      }
    } catch (err) {
      console.error('Failed to fetch details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleContact = async (contactId: string, enabled: boolean) => {
    try {
      setOrgDetails(prev => ({
        ...prev,
        contacts: prev.contacts.map(c => c.id === contactId ? { ...c, send_enabled: enabled } : c)
      }));
      
      await fetch(`${API_BASE}/contacts/${contactId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
    } catch (err) {
      console.error('Failed to toggle contact', err);
    }
  };

  const handleSendToInstantly = async (orgId: string) => {
    setSendingToInstantly(orgId);
    try {
      const res = await fetch(`${API_BASE}/org/${orgId}/send-instantly`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        fetchDashboardData(); // Refresh to show last_contacted_at
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setSendingToInstantly(null);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync-all`, { method: 'POST' });
      if (res.ok) {
        await fetchDashboardData();
        alert('Successfully synced all organizations and events from Cohort!');
      } else {
        const error = await res.json();
        alert(`Failed to sync: ${error.error}`);
      }
    } catch (e: any) {
      alert(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hind GTM Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={globalCityFilter} onValueChange={(v: any) => setGlobalCityFilter(v)}>
            <SelectTrigger className="w-[180px] h-9 bg-white">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex-1 p-6 w-full max-w-[1600px] mx-auto space-y-8">
        {/* Dashboard Section */}
        <section className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
          <div className="border-b bg-slate-50/50 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TabButton 
                active={activeTab === 'pending'} 
                onClick={() => setActiveTab('pending')}
                icon={<Calendar className="w-4 h-4" />}
                count={pendingScrapes.length}
              >
                Scraped Events
              </TabButton>
              <TabButton 
                active={activeTab === 'claimed'} 
                onClick={() => setActiveTab('claimed')}
                icon={<CheckCircle className="w-4 h-4" />}
                count={orgs.filter(o => o.status === 'claimed').length}
              >
                Claimed Communities
              </TabButton>
              <TabButton 
                active={activeTab === 'unclaimed'} 
                onClick={() => setActiveTab('unclaimed')}
                icon={<AlertCircle className="w-4 h-4" />}
                count={orgs.filter(o => o.status === 'unclaimed').length}
              >
                Unclaimed Communities
              </TabButton>
              <TabButton 
                active={activeTab === 'failed'} 
                onClick={() => setActiveTab('failed')}
                icon={<XCircle className="w-4 h-4" />}
                count={orgs.filter(o => o.status === 'failed').length}
              >
                Failed
              </TabButton>
              <TabButton 
                active={activeTab === 'urls'} 
                onClick={() => setActiveTab('urls')}
                icon={<LinkIcon className="w-4 h-4" />}
                count={urlsCount} 
              >
                Scraped URLs
              </TabButton>
            </div>
          </div>

          <div className="rounded-md border mx-6 mb-6">
            {activeTab === 'pending' ? (
              <ScrapedEventsPanel pendingScrapes={pendingScrapes} onRefresh={fetchDashboardData} />
            ) : activeTab === 'urls' ? (
              <ScrapedUrlsPanel 
                setUrlsCount={setUrlsCount} 
                urlProcessingUI={
                  <>
                    {/* URL Processing Section */}
        <section className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Scrap new event</h2>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Paste event url from allevents,meraevents, eventbrite etc"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
              />
            </div>
            <button 
              onClick={handleProcess}
              disabled={isProcessing || !url}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Scrap'}
            </button>
          </div>

          {/* Logs View */}
          {logs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 overflow-hidden shadow-inner font-mono text-sm h-64 overflow-y-auto">
              <div className="space-y-1.5">
                {logs.map((log, i) => (
                  <div key={i} className={cn(
                    "whitespace-pre-wrap break-words leading-relaxed",
                    log.type === 'error' ? "text-red-400" : 
                    log.type === 'done' ? "text-green-400 font-bold" : 
                    "text-slate-300"
                  )}>
                    {log.message}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </section>
                  </>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Subcommunity Name</TableHead>
                    <TableHead>Community Name</TableHead>
                    <TableHead>Created For</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead className="flex items-center gap-1 min-w-[120px]">
                      Hind Status
                      <Button variant="ghost" size="icon" disabled={isSyncing} className="h-6 w-6 ml-1 text-slate-500 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); handleSyncAll(); }} title="Sync all organization statuses">
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[150px]">Organization Name</TableHead>
                    <TableHead className="min-w-[150px]">Address</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Admin Invite Link</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Last Contacted</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
                      No organizations found in this category.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map(org => (
                    <EditableOrgRow 
                      key={org.id}
                      org={org}
                      expandedOrg={expandedOrg}
                      toggleExpand={toggleExpand}
                      handleSendToInstantly={handleSendToInstantly}
                      sendingToInstantly={sendingToInstantly}
                      onRefresh={fetchDashboardData}
                      loadingDetails={loadingDetails}
                      orgDetails={orgDetails}
                      handleToggleContact={handleToggleContact}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </section>
      </main>

      <Dialog open={expandedOrg !== null} onOpenChange={(isOpen) => !isOpen && setExpandedOrg(null)}>
        <DialogContent className="sm:max-w-[90vw] w-[90vw] h-[85vh] sm:max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              {expandedOrg?.type === 'contacts' ? (
                <><Users className="w-5 h-5 text-blue-600"/> Contacts for {orgs.find(o => o.id === expandedOrg?.id)?.name}</>
              ) : (
                <><Calendar className="w-5 h-5 text-purple-600"/> Events for {orgs.find(o => o.id === expandedOrg?.id)?.name}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-auto border rounded-md shadow-sm bg-white p-6">
            {loadingDetails ? (
              <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                Loading data...
              </div>
            ) : expandedOrg?.type === 'contacts' ? (
              <div className="min-w-[1200px]">
                <ContactsPanel contacts={orgDetails.contacts} onToggle={handleToggleContact} orgId={expandedOrg.id} onRefresh={fetchDashboardData} />
              </div>
            ) : expandedOrg?.type === 'events' ? (
              <div className="min-w-[1200px]">
                <EventsPanel events={orgDetails.events} orgId={expandedOrg.id} onRefresh={fetchDashboardData} />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({ active, onClick, icon, children, count }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
        active 
          ? "bg-white text-blue-700 shadow-sm border border-slate-200" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      {icon}
      {children}
      <span className={cn(
        "ml-1.5 px-2 py-0.5 rounded-full text-xs",
        active ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
      )}>
        {count}
      </span>
    </button>
  );
}


function EditableContactRow({ contact, onToggle, orgId, onRefresh }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(contact);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (contact.id.startsWith('new-')) {
        await fetch(`${API_BASE}/org/${orgId}/contacts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      } else {
        await fetch(`${API_BASE}/contacts/${contact.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      }
      setIsEditing(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact?')) return;
    if (!contact.id.startsWith('new-')) {
      await fetch(`${API_BASE}/contacts/${contact.id}`, { method: 'DELETE' });
    }
    onRefresh();
  };

  if (isEditing) {
    return (
      <TableRow className="bg-muted/50">
        <TableCell><Input className="h-8 text-xs" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Title" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="Email" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="Phone" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.social || ''} onChange={e => setEditData({...editData, social: e.target.value})} placeholder="Social Link" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.source || ''} onChange={e => setEditData({...editData, source: e.target.value})} placeholder="Source" /></TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="default" onClick={handleSave} disabled={isSaving}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); if(contact.id.startsWith('new-')) onRefresh(); }}>Cancel</Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{contact.name || '-'}</TableCell>
      <TableCell className="text-muted-foreground">{contact.title || '-'}</TableCell>
      <TableCell>{contact.email || '-'}</TableCell>
      <TableCell>{contact.phone || '-'}</TableCell>
      <TableCell>
        {contact.social ? <a href={contact.social} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Link</a> : '-'}
      </TableCell>
      <TableCell className="text-muted-foreground">{contact.source || '-'}</TableCell>
      <TableCell>
        {contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={contact.send_enabled} 
              onChange={(e) => onToggle(contact.id, e.target.checked)} 
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <DropdownMenu>
            {/* @ts-ignore */}
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ContactsPanel({ contacts, onToggle, orgId, onRefresh }: { contacts: Contact[], onToggle: (id: string, enabled: boolean) => void, orgId: string, onRefresh: () => void }) {
  const [localContacts, setLocalContacts] = useState(contacts);

  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  const handleAddNew = () => {
    const newContact = { id: `new-${Date.now()}`, name: '', title: '', email: '', phone: '', social: '', source: 'Manual', send_enabled: true };
    setLocalContacts([...localContacts, newContact as Contact]);
  };

  const handleRefresh = () => {
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium leading-none">Contacts <Badge variant="secondary" className="ml-2">{contacts.length}</Badge></h3>
        <Button size="sm" variant="outline" onClick={handleAddNew}><Plus className="w-4 h-4 mr-2"/> Add Contact</Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title/Designation</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Social</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Contacted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localContacts.length === 0 ? (
               <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground h-24">No contacts found.</TableCell></TableRow>
            ) : (
              localContacts.map(c => (
                 <EditableContactRow 
                    key={c.id} 
                    contact={c} 
                    orgId={orgId} 
                    onToggle={onToggle} 
                    onRefresh={handleRefresh} 
                 />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EditableEventRow({ event, orgId, onSendEvent, onRefresh }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(event);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (event.id.startsWith('new-')) {
        await fetch(`${API_BASE}/org/${orgId}/events`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      } else {
        await fetch(`${API_BASE}/events/${event.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
        });
      }
      setIsEditing(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    if (!event.id.startsWith('new-')) {
      await fetch(`${API_BASE}/events/${event.id}`, { method: 'DELETE' });
    }
    onRefresh();
  };

  if (isEditing) {
    return (
      <TableRow className="bg-muted/50">
        <TableCell><Input className="h-8 text-xs" value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Title" /></TableCell>
        <TableCell>
          <Select value={editData.status || 'new'} onValueChange={(v) => setEditData({...editData, status: v})}>
            <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.event_date || ''} onChange={e => setEditData({...editData, event_date: e.target.value})} placeholder="Date/Time" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="Location" /></TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.hind_url || ''} onChange={e => setEditData({...editData, hind_url: e.target.value})} placeholder="Hind URL" /></TableCell>
        <TableCell>
          <Select value={editData.hind_status || 'unpublished'} onValueChange={(v) => setEditData({...editData, hind_status: v})}>
            <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Hind Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpublished">Unpublished</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell><Input className="h-8 text-xs" value={editData.source_url || ''} onChange={e => setEditData({...editData, source_url: e.target.value})} placeholder="Source URL" /></TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="default" onClick={handleSave} disabled={isSaving}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); if(event.id.startsWith('new-')) onRefresh(); }}>Cancel</Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium max-w-[200px] truncate" title={event.title}>
        {event.title}
      </TableCell>
      <TableCell>
        <Badge variant={event.status === 'ongoing' ? "default" : event.status === 'expired' ? "destructive" : "secondary"} className="capitalize">
          {event.status}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {event.event_date ? (
           <span className="font-semibold text-slate-900 text-[11px]">{
             (() => {
                try {
                  const formatPart = (d: Date) => {
                    let dStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
                    dStr = dStr.replace(/^([A-Za-z]+)\s/, '$1, ');
                    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return `${dStr} • ${timeStr}`;
                  };
                  // Strip timezone offset (Z or +05:30) to prevent browser from shifting the time
                  const cleanStartDate = event.event_date.substring(0, 19);
                  const sd = new Date(cleanStartDate);
                  if (isNaN(sd.getTime())) return event.event_date;
                  let res = formatPart(sd);
                  if (event.end_date && event.end_date !== "2026-08-15") {
                     const cleanEndDate = event.end_date.substring(0, 19);
                     const ed = new Date(cleanEndDate);
                     if (!isNaN(ed.getTime())) res += " to " + formatPart(ed);
                  }
                  // We can't know the original timezone from postgres UTC string reliably here,
                  // but assuming the user wants to see it in their local timezone (IST):
                  res += " (IST)";
                  return res;
                } catch(e) { return event.event_date; }
             })()
           }</span>
        ) : '-'}
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {event.location ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-900">{event.location.split('\n')[0]}</span>
            {event.location.split('\n')[1] && <span className="text-[10px] text-muted-foreground leading-tight">{event.location.split('\n')[1]}</span>}
          </div>
        ) : '-'}
      </TableCell>
      <TableCell>
        {event.hind_url ? (
          <div className="flex items-center">
             <span className="text-[11px] text-muted-foreground truncate max-w-[120px] select-all cursor-text" title={event.hind_url}>
               {event.hind_url}
             </span>
          </div>
        ) : '-'}
      </TableCell>
      <TableCell>
        <Badge variant={event.hind_status === 'published' ? "default" : event.hind_status === 'completed' ? "secondary" : "outline"} className="capitalize">
          {event.hind_status || 'pending'}
        </Badge>
      </TableCell>
      <TableCell>
        {event.source_url ? (
          <a href={event.source_url} target="_blank" rel="noreferrer" className="text-primary flex items-start gap-1 text-[11px] break-all group">
            <LinkIcon className="w-3 h-3 mt-0.5 shrink-0"/> 
            <span className="capitalize underline decoration-slate-400 underline-offset-2 hover:decoration-primary">{getDomainName(event.source_url)}</span>
          </a>
        ) : '-'}
      </TableCell>
      <TableCell>
        {event.sent_on ? new Date(event.sent_on).toLocaleString() : '-'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() => onSendEvent && onSendEvent(event.id)}
            className="h-8"
          >
            <Send className="w-3 h-3 mr-2" /> Send
          </Button>
          <DropdownMenu>
            {/* @ts-ignore */}
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function EventsPanel({ events, orgId, onSendEvent, onRefresh }: { events: Event[], orgId: string, onSendEvent?: (eventId: string) => void, onRefresh: () => void }) {
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium leading-none">Events <Badge variant="secondary" className="ml-2">{events.length}</Badge></h3>
        

      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Hind Event URL</TableHead>
              <TableHead className="min-w-[120px] h-10 mt-1">
                Hind Status
              </TableHead>
              <TableHead>Source URL</TableHead>
              <TableHead>Sent On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localEvents.length === 0 ? (
               <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground h-24">No events found.</TableCell></TableRow>
            ) : (
              localEvents.map(e => (
                <EditableEventRow 
                   key={e.id} 
                   event={e} 
                   orgId={orgId} 
                   onSendEvent={onSendEvent} 
                   onRefresh={onRefresh} 
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
