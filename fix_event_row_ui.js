const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /  if \(isEditing\) \{\s*return \([\s\S]*?<\/TableRow>\s*\);\s*\}/;

const replacement = `  if (isEditing) {
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
  }`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Replaced inline TableRow editing with consistent Dialog for events!");
} else {
    console.log("Regex not found");
}
