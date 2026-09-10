import { toast } from "@/components/ui/toast";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={className}>{children}</label>
);

export function EditableOrgDialog({ org, onClose, onRefresh }: { org: any, onClose: () => void, onRefresh: () => void }) {
  const [editData, setEditData] = useState({ ...org });
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
      toast.add({ type: "success", description: org ? "Organization updated successfully." : "Organization created successfully." });
      onRefresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save organization');
    } finally {
      setIsSaving(false);
    }
  };

  const updateRichData = (key: string, value: string) => {
    setEditData({
      ...editData,
      rich_data: { ...(editData.rich_data || {}), [key]: value }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Building2 className="w-5 h-5 text-indigo-600" /> Edit Organization Profile
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Subcommunity Name</Label>
              <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Main Name..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Organization Name</Label>
              <Input value={editData.org_name || ''} onChange={e => setEditData({...editData, org_name: e.target.value})} placeholder="Internal Org Name..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Parent Community</Label>
              <Input value={editData.community_name || ''} onChange={e => setEditData({...editData, community_name: e.target.value})} placeholder="e.g. Events in Mumbai..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Owner</Label>
              <Input value={editData.owner || ''} onChange={e => setEditData({...editData, owner: e.target.value})} placeholder="Owner Name..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Created For</Label>
              <Input value={editData.created_for || ''} onChange={e => setEditData({...editData, created_for: e.target.value})} placeholder="event / contacts" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Members Count</Label>
              <Input type="number" value={editData.members_count || 0} onChange={e => setEditData({...editData, members_count: parseInt(e.target.value)||0})} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hind Status</Label>
              <Select value={editData.hind_status === 'published' ? 'published' : 'unpublished'} onValueChange={(v) => setEditData({...editData, hind_status: v})}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="col-span-2 text-sm font-semibold text-slate-800 border-b pb-2 mb-2">Location & Links</h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">City</Label>
              <Input value={editData.city || ''} onChange={e => setEditData({...editData, city: e.target.value})} placeholder="City..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Address</Label>
              <Input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} placeholder="Full Address..." />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Website URL</Label>
              <Input value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Facebook</Label>
              <Input value={editData.rich_data?.facebook || ''} onChange={e => updateRichData('facebook', e.target.value)} placeholder="Facebook Link..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Instagram</Label>
              <Input value={editData.rich_data?.instagram || ''} onChange={e => updateRichData('instagram', e.target.value)} placeholder="Instagram Link..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">YouTube</Label>
              <Input value={editData.rich_data?.youtube || ''} onChange={e => updateRichData('youtube', e.target.value)} placeholder="YouTube Link..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Admin Invite Link</Label>
              <Input value={editData.admin_invite_link || ''} onChange={e => setEditData({...editData, admin_invite_link: e.target.value})} placeholder="https://dev.cohort..." />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSaving ? 'Saving...' : 'Save Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
