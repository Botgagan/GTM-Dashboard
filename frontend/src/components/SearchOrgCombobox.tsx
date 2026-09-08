import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchOrgCombobox({ orgs, onLinkOrg }: { orgs: any[], onLinkOrg: (orgId: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button size="icon" variant="outline" className="h-6 w-6" title="Search and Link to Existing Organization">
          <Search className="w-3 h-3 text-slate-600" />
        </Button>
      } />
      <PopoverContent className="w-[300px] p-2" align="start" side="bottom">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search existing orgs..." 
            className="h-8 text-xs"
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1">
          {orgs
            .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 10)
            .map(o => (
              <div 
                key={o.id}
                className="text-left text-xs p-2 hover:bg-slate-100 rounded cursor-pointer"
                onClick={() => { onLinkOrg(o.id); setOpen(false); }}
              >
                <div className="font-semibold">{o.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{o.city || 'No location'}</div>
              </div>
            ))
          }
          {orgs.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-xs text-muted-foreground p-2">No organizations found.</div>
          )}
        </div>
        <div className="border-t pt-2 mt-1 flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 text-red-600" onClick={() => { onLinkOrg(null); setOpen(false); }}>Unlink</Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
