import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Save, X, Upload, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchData = async () => {
    const { data: tablesData } = await supabase.from('tables').select('*').order('order');
    const { data: groupsData } = await supabase.from('table_groups').select('*');
    if (tablesData) setTables(tablesData);
    if (groupsData) setGroups(groupsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Direct toggle with optimistic update
  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    // Immediate UI update
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, is_temporarily_unavailable: newStatus } : table
      )
    );
    // Update database
    const { error } = await supabase
      .from('tables')
      .update({ is_temporarily_unavailable: newStatus })
      .eq('id', id);
    if (error) {
      // Revert on error
      setTables(prev =>
        prev.map(table =>
          table.id === id ? { ...table, is_temporarily_unavailable: currentStatus } : table
        )
      );
      toast.error('Failed to update availability');
    } else {
      toast.success(`Table marked as ${newStatus ? 'unavailable' : 'available'}`);
    }
  };

  const startEdit = (table) => {
    setEditingTable(table.id);
    setEditForm({ ...table });
  };

  const saveEdit = async () => {
    // Optimistic update for all fields
    setTables(prev =>
      prev.map(t => t.id === editingTable ? { ...t, ...editForm } : t)
    );
    const { error } = await supabase
      .from('tables')
      .update({
        name: editForm.name,
        capacity: editForm.capacity,
        x_pos: editForm.x_pos,
        y_pos: editForm.y_pos,
        width: editForm.width,
        height: editForm.height,
        group_id: editForm.group_id || null,
        is_temporarily_unavailable: editForm.is_temporarily_unavailable,
      })
      .eq('id', editingTable);
    if (error) {
      await fetchData(); // revert to database state
      toast.error('Update failed');
    } else {
      toast.success('Table updated');
    }
    setEditingTable(null);
  };

  const handleMediaUpload = async (tableId, file, type) => {
    const bucket = 'table-media';
    const fileName = `${tableId}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) {
      toast.error('Upload failed');
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const field = type === 'photo' ? 'photo_url' : 'video_url';
    await supabase.from('tables').update({ [field]: publicUrl }).eq('id', tableId);
    toast.success(`${type} uploaded`);
    await fetchData();
  };

  if (loading) return <div className="p-8">Loading tables...</div>;

  return (
    <div className="p-4">
      <h1 className="font-display text-2xl mb-6">Table Manager</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th>Capacity</th>
              <th>Position</th>
              <th>Group</th>
              <th>Status</th>
              <th>Media</th>
              <th>Actions</th>
             </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <tr key={table.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-2 font-medium">{table.name}</td>
                <td>{table.capacity}</td>
                <td>({table.x_pos || 0}, {table.y_pos || 0})</td>
                <td>{groups.find(g => g.id === table.group_id)?.name || '—'}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    table.is_temporarily_unavailable
                      ? 'bg-red-600/30 text-red-300'
                      : 'bg-green-600/30 text-green-300'
                  }`}>
                    {table.is_temporarily_unavailable ? '❌ Unavailable' : '✅ Available'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    {table.photo_url && <a href={table.photo_url} target="_blank" rel="noreferrer" className="text-amber-400 text-xs">Photo</a>}
                    {table.video_url && <a href={table.video_url} target="_blank" rel="noreferrer" className="text-amber-400 text-xs">Video</a>}
                  </div>
                </td>
                <td className="flex gap-2">
                  <button
                    onClick={() => toggleAvailability(table.id, table.is_temporarily_unavailable)}
                    className="p-1.5 rounded-md hover:bg-white/10 transition"
                    title={table.is_temporarily_unavailable ? 'Mark Available' : 'Mark Unavailable'}
                  >
                    {table.is_temporarily_unavailable ? <Ban className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                  </button>
                  <button
                    onClick={() => startEdit(table)}
                    className="p-1.5 rounded-md hover:bg-white/10 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal (same as before) */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setEditingTable(null)}>
          <div className="bg-smoke-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
              <h2 className="font-heading text-xl">Edit {editForm.name}</h2>
              <button onClick={() => setEditingTable(null)} className="p-1 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/10 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: parseInt(e.target.value)})} className="w-full bg-white/10 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>X</label><input type="number" value={editForm.x_pos || 0} onChange={e => setEditForm({...editForm, x_pos: parseInt(e.target.value)})} className="w-full bg-white/10 rounded-lg px-3 py-2" /></div>
                <div><label>Y</label><input type="number" value={editForm.y_pos || 0} onChange={e => setEditForm({...editForm, y_pos: parseInt(e.target.value)})} className="w-full bg-white/10 rounded-lg px-3 py-2" /></div>
              </div>
              <div>
                <label>Group</label>
                <select value={editForm.group_id || ''} onChange={e => setEditForm({...editForm, group_id: e.target.value || null})} className="w-full bg-white/10 rounded-lg px-3 py-2">
                  <option value="">None</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label>Availability</label>
                <select value={editForm.is_temporarily_unavailable} onChange={e => setEditForm({...editForm, is_temporarily_unavailable: e.target.value === 'true'})} className="w-full bg-white/10 rounded-lg px-3 py-2">
                  <option value="false">✅ Available</option>
                  <option value="true">❌ Unavailable</option>
                </select>
              </div>
              <div>
                <label>Photo</label>
                {editForm.photo_url && <img src={editForm.photo_url} className="h-24 object-cover rounded-lg mb-2" />}
                <label className="btn-outline py-1 px-3 text-xs cursor-pointer inline-block">
                  <Upload className="w-3 h-3 inline mr-1" /> Upload Photo
                  <input type="file" accept="image/*" onChange={e => handleMediaUpload(editingTable, e.target.files[0], 'photo')} className="hidden" />
                </label>
              </div>
              <div>
                <label>Video</label>
                {editForm.video_url && <video src={editForm.video_url} className="h-24 object-cover rounded-lg mb-2" controls />}
                <label className="btn-outline py-1 px-3 text-xs cursor-pointer inline-block">
                  <Upload className="w-3 h-3 inline mr-1" /> Upload Video
                  <input type="file" accept="video/*" onChange={e => handleMediaUpload(editingTable, e.target.files[0], 'video')} className="hidden" />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button onClick={() => setEditingTable(null)} className="btn-outline py-2 px-4">Cancel</button>
              <button onClick={saveEdit} className="btn-primary py-2 px-4"><Save className="w-4 h-4 inline mr-1" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}