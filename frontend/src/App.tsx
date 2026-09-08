import { Switch } from "@/components/ui/switch"
import { SearchOrgCombobox } from "./components/SearchOrgCombobox";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X } from "lucide-react";
import { EditableOrgForm } from './EditableOrgForm';
import { EditableEventForm } from './EditableEventForm';
import { EditableOrgDialog } from './EditableOrgDialog';
import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Edit, Trash, Plus, Link as LinkIcon, Search, Play, Activity, RefreshCw, Users, Calendar, Settings, Loader2 } from 'lucide-react';
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
  DialogFooter,
} from "@/components/ui/dialog";

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

function EditableOrgRow({ org, expandedOrg, toggleExpand, handleSendToInstantly, sendingToInstantly, onRefresh, linkingManualOrg, handleLinkManualOrg }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const handleDelete = async () => {
    if (!window.confirm('Delete this organization completely?')) return;
    if (!org.id.startsWith('new-')) {
      await fetch(`${API_BASE}/org/${org.id}`, { method: 'DELETE' });
    }
    onRefresh();
  };

  if (isEditing) {
    // We now just let the normal row render, and attach the Dialog below it.
}

  return (
    <React.Fragment>
      {isEditing && <EditableOrgDialog org={org} onClose={() => setIsEditing(false)} onRefresh={onRefresh} />}
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
          {org.rich_data?.facebook ? (
            <a href={org.rich_data.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[11px] break-all flex items-center gap-1">
               <LinkIcon className="w-3 h-3"/> FB
            </a>
          ) : '-'}
        </TableCell>
        <TableCell>
          {org.rich_data?.instagram ? (
            <a href={org.rich_data.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline text-[11px] break-all flex items-center gap-1">
               <LinkIcon className="w-3 h-3"/> IG
            </a>
          ) : '-'}
        </TableCell>
        <TableCell>
          {org.rich_data?.youtube ? (
            <a href={org.rich_data.youtube} target="_blank" rel="noreferrer" className="text-red-600 hover:underline text-[11px] break-all flex items-center gap-1">
               <LinkIcon className="w-3 h-3"/> YT
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
              {org.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                  onClick={(e) => { e.stopPropagation(); handleLinkManualOrg(org.id); }}
                  disabled={linkingManualOrg === org.id}
                >
                  {linkingManualOrg === org.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <LinkIcon className="w-3 h-3 mr-1.5" />
                  )}
                  Link Manual Org
                </Button>
              )}
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
                  {org.last_contacted_at ? 'Sent' : 'Lemlist'}
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

function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  
  const filteredScrapes = pendingScrapes.filter(scrape => {
      if (!date?.from && !date?.to) return true;
      
      const scrapeDate = new Date(scrape.created_at);
      if (isNaN(scrapeDate.getTime())) return true;
      
      const scrapeDay = new Date(scrapeDate.getFullYear(), scrapeDate.getMonth(), scrapeDate.getDate());
      
      if (date.from && date.to) {
          const fromDay = new Date(date.from.getFullYear(), date.from.getMonth(), date.from.getDate());
          const toDay = new Date(date.to.getFullYear(), date.to.getMonth(), date.to.getDate());
          return scrapeDay >= fromDay && scrapeDay <= toDay;
      } else if (date.from) {
          const fromDay = new Date(date.from.getFullYear(), date.from.getMonth(), date.from.getDate());
          return scrapeDay >= fromDay;
      } else if (date.to) {
          const toDay = new Date(date.to.getFullYear(), date.to.getMonth(), date.to.getDate());
          return scrapeDay <= toDay;
      }
      return true;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-end items-center gap-2 p-3 border-b">
        {(date?.from || date?.to) && (
          <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="h-9 px-2 text-slate-500 hover:text-slate-700">
            <X className="w-4 h-4 mr-1" /> Clear Filter
          </Button>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-normal text-xs h-9",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Filter by Discovered At</span>
              )}
            </Button>} />
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarUI
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Title</TableHead>
            <TableHead>Discovered At</TableHead>
            <TableHead>New/Existing Org</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source URL</TableHead>
            <TableHead>Org Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredScrapes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                No pending scraped events.
              </TableCell>
            </TableRow>
          ) : (
            filteredScrapes.map((scrape: any) => (
              <PendingEventRow key={scrape.id} scrape={scrape} orgs={orgs} onRefresh={onRefresh} onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })} />
            ))
          )}
        </TableBody>
      </Table>
      {expandedPending !== null && activeScrape && (
        <EditableOrgForm scrape={activeScrape} orgs={orgs} onRefresh={onRefresh} onClose={() => setExpandedPending(null)} />
      )}
    </div>
  );
}
function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
  const ev = payload.mappedEventData;

  const isLinked = !!scrape.linked_org_id;
  const linkedOrgName = scrape.linked_org_name || "Existing Org";

  const handleLinkOrg = async (orgId: string | null) => {
    try {
      await fetch(`${API_BASE}/pending-scrapes/${scrape.id}/link-org`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });
      setIsLinking(false);
      onRefresh();
    } catch(e) { console.error(e); }
  };

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
      <TableCell className="whitespace-nowrap text-[11px] text-slate-600">
        {new Date(scrape.created_at).toLocaleString()}
      </TableCell>
      <TableCell>
        {isLinked ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 max-w-[120px] truncate" title={`Existing Org: ${linkedOrgName}`}>
            Existing
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            New
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.startTime || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endDate || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endTime || 'N/A'}</span></TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = ev?.city || payload.contactInfo?.city;
           const area = payload.finalLocation || ev?.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>
      <TableCell>
        <a href={scrape.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] break-all flex items-center gap-1">
          <LinkIcon className="w-3 h-3" /> Link
        </a>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={onViewOrg}>
            View
          </Button>
          {!isResolved && (
            <SearchOrgCombobox orgs={orgs} onLinkOrg={handleLinkOrg} />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right align-middle relative">
        <div className="flex items-center justify-end gap-2">
          {!isResolved ? (
            <>
              <Button size="sm" variant="default" onClick={handleApprove} disabled={isApproving}>
                {isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
            </>
          ) : (
             <span className="text-xs text-muted-foreground mr-4 font-medium uppercase tracking-wider">{scrape.status}</span>
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
            <Button
              variant={sourceTab === 'cron-job' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceTab('cron-job')}
              className="rounded-md"
            >
              Cron-Job Scraping
            </Button>
            <Button
              variant={sourceTab === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceTab('manual')}
              className="rounded-md"
            >
              Manual Scraping
            </Button>
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
  const [orgDetails, setOrgDetails] = useState<{ contacts: Contact[]; events: OrgEvent[] }>({ contacts: [], events: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingToInstantly, setSendingToInstantly] = useState<string | null>(null);
  const [linkingManualOrg, setLinkingManualOrg] = useState<string | null>(null);
  const [manualOrgModal, setManualOrgModal] = useState<{isOpen: boolean, orgId: string | null, url: string}>({isOpen: false, orgId: null, url: ""});

  const handleLinkManualOrg = (orgId: string) => {
    setManualOrgModal({ isOpen: true, orgId, url: "" });
  };

  const submitManualOrg = async () => {
    const { orgId, url: manualUrl } = manualOrgModal;
    if (!orgId || !manualUrl) return;

    setManualOrgModal({ isOpen: false, orgId: null, url: "" });
    setLinkingManualOrg(orgId);
    
    try {
      const res = await fetch(`${API_BASE}/org/${orgId}/retry-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualUrl })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Success! The manual organization was linked, the event was pushed, and the record has been moved to Unclaimed Communities.");
        fetchDashboardData();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLinkingManualOrg(null);
    }
  };

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
      const res = await fetch(`${API_BASE}/org/${orgId}/send-lemlist`, { method: 'POST' });
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
              <SelectValue placeholder="ALL" />
            </SelectTrigger>
            <SelectContent className="max-h-[160px] overflow-y-auto">
              <SelectItem value="All">ALL</SelectItem>
              {cities.includes("Online") && <SelectItem value="Online">Online</SelectItem>}
              {cities.filter(c => c !== "Online" && c.toLowerCase() !== "all").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              <ScrapedEventsPanel pendingScrapes={pendingScrapes} orgs={orgs} onRefresh={fetchDashboardData} />
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
              <Input 
                type="text" 
                placeholder="Paste event url from allevents,meraevents, eventbrite etc"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
                className="w-full pl-10 h-14 bg-slate-50 rounded-xl"
              />
            </div>
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !url}
              className="flex items-center gap-2 px-6 py-6 rounded-xl whitespace-nowrap text-md"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Scrap'}
            </Button>
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
                    <TableHead>Facebook</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>YouTube</TableHead>
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
                      linkingManualOrg={linkingManualOrg}
                      handleLinkManualOrg={handleLinkManualOrg}
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
      <Dialog open={manualOrgModal.isOpen} onOpenChange={(isOpen) => setManualOrgModal(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Manual Organization</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please paste the URL of the organization you manually created on Hind Social:
              <br/>
              <span className="text-xs font-mono text-slate-500">(e.g., https://turbo.cohort.social/admin/organisation-profile?comId=...&orgId=...)</span>
            </p>
            <Input 
              value={manualOrgModal.url}
              onChange={(e) => setManualOrgModal(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://turbo.cohort.social/..."
              className="w-full"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setManualOrgModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button onClick={submitManualOrg} disabled={!manualOrgModal.url}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({ active, onClick, icon, children, count }: any) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
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
    </Button>
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
      <React.Fragment>
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && setIsEditing(false)}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
                <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600"/> Edit Live Event Details
                    </DialogTitle>
                </DialogHeader>
                
                <div className="p-6 space-y-8 bg-slate-50/50 overflow-y-auto flex-1">
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">Event Basics</h3>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Event Title</label>
                            <Input value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Date/Time</label>
                                <Input value={editData.event_date || ''} onChange={e => setEditData({...editData, event_date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                                <Select value={editData.status || 'new'} onValueChange={(v) => setEditData({...editData, status: v})}>
                                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="ongoing">Ongoing</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">External Links & Location</h3>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                            <Input value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Hind URL</label>
                                <Input value={editData.hind_url || ''} onChange={e => setEditData({...editData, hind_url: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Source URL</label>
                                <Input value={editData.source_url || ''} onChange={e => setEditData({...editData, source_url: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Hind Status</label>
                            <Select value={editData.hind_status || 'unpublished'} onValueChange={(v) => setEditData({...editData, hind_status: v})}>
                                <SelectTrigger><SelectValue placeholder="Hind Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unpublished">Unpublished</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Save Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <TableRow className="opacity-50">
          <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
          <TableCell><Badge variant="secondary" className="capitalize">{event.status}</Badge></TableCell>
          <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_date || 'N/A'}</span></TableCell>
          <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_time || 'N/A'}</span></TableCell>
          <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_date || 'N/A'}</span></TableCell>
          <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_time || 'N/A'}</span></TableCell>
          <TableCell className="max-w-[200px] whitespace-normal">
            <span className="text-[11px]">{event.location || 'Online'}</span>
          </TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
          <TableCell>-</TableCell>
      </TableRow>
      </React.Fragment>
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
          <Switch 
            checked={contact.send_enabled} 
            onCheckedChange={(checked) => onToggle(contact.id, checked)} 
            aria-label="Toggle send status"
          />
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
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_time || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_time || 'N/A'}</span></TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = event.city;
           const area = event.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
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

function EventsPanel({ events, orgId, onSendEvent, onRefresh }: { events: OrgEvent[], orgId: string, onSendEvent?: (eventId: string) => void, onRefresh: () => void }) {
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
              <TableHead>Start Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>
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
