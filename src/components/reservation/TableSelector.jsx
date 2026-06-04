import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Camera, Video, X } from 'lucide-react';

export default function TableSelector({ date, time, guests, onSelectTables }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewTable, setPreviewTable] = useState(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/available-tables?date=${date}&time=${time}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTables(data.available || []);
    } catch (err) {
      console.error(err);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [date, time]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Memoize combined options to prevent recreation on every render
  const combinedOptions = useMemo(() => {
    const groups = {};
    tables.forEach(t => {
      const gid = t.group_id || t.id;
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(t);
    });
    return Object.values(groups).map(groupTables => ({
      id: groupTables[0].group_id || `single_${groupTables[0].id}`,
      name: groupTables.length > 1 ? `${groupTables[0].name} + ${groupTables.length-1} more` : groupTables[0].name,
      capacity: groupTables.reduce((sum, t) => sum + t.capacity, 0),
      tables: groupTables,
      photo_url: groupTables[0].photo_url,
      video_url: groupTables[0].video_url,
    }));
  }, [tables]);

  const toggleSelection = (option) => {
    const currentCapacity = selectedIds.reduce((sum, id) => {
      const opt = combinedOptions.find(o => o.id === id);
      return sum + (opt?.capacity || 0);
    }, 0);
    const newCapacity = selectedIds.includes(option.id) ? currentCapacity - option.capacity : currentCapacity + option.capacity;
    if (newCapacity > guests && !selectedIds.includes(option.id)) {
      alert(`This would exceed your party size of ${guests}. Please select a different combination.`);
      return;
    }
    setSelectedIds(prev =>
      prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id]
    );
  };

  // Effect to notify parent of selected table IDs - only when selectedIds changes
  useEffect(() => {
    const actualTableIds = selectedIds.flatMap(id => {
      const opt = combinedOptions.find(o => o.id === id);
      return opt ? opt.tables.map(t => t.id) : [];
    });
    onSelectTables(actualTableIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]); // Only depend on selectedIds, not combinedOptions

  if (loading) return <div className="text-center py-8">Loading available tables...</div>;

  return (
    <div>
      <h3 className="font-heading text-xl mb-3">Select your tables</h3>
      <p className="text-sm text-smoke-400 mb-4">Click on a table group to select. You can combine multiple areas.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {combinedOptions.map(opt => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <div
              key={opt.id}
              onClick={() => toggleSelection(opt)}
              className={`relative cursor-pointer rounded-xl border-2 transition-all p-3 ${isSelected ? 'border-amber-500 bg-amber-600/20' : 'border-white/10 bg-white/5 hover:border-amber-500/50'}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{opt.name}</span>
                <div className="flex gap-1">
                  {opt.photo_url && (
                    <button onClick={(e) => { e.stopPropagation(); setPreviewTable(opt); }} className="text-smoke-400 hover:text-amber-400">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  {opt.video_url && (
                    <button onClick={(e) => { e.stopPropagation(); setPreviewTable(opt); }} className="text-smoke-400 hover:text-amber-400">
                      <Video className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-smoke-400 mt-1">
                <Users className="w-3 h-3" /> {opt.capacity} guests
              </div>
            </div>
          );
        })}
      </div>

      {previewTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTable(null)}>
          <div className="relative max-w-2xl w-full bg-smoke-900 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewTable(null)} className="absolute top-2 right-2 p-2 rounded-full bg-white/10"><X className="w-5 h-5" /></button>
            {previewTable.video_url ? (
              <video src={previewTable.video_url} controls autoPlay className="w-full rounded-lg" />
            ) : previewTable.photo_url ? (
              <img src={previewTable.photo_url} alt={previewTable.name} className="w-full rounded-lg" />
            ) : null}
            <h4 className="font-heading text-center mt-3">{previewTable.name}</h4>
          </div>
        </div>
      )}
    </div>
  );
}