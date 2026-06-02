import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Users, Eye } from 'lucide-react';
import TableViewer from '@/components/ui/TableViewer';

export default function TableSelector({ date, time, guests, onSelectTables }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [viewingTable, setViewingTable] = useState(null);

  useEffect(() => {
    const fetchAvailable = async () => {
      const res = await fetch(`/.netlify/functions/available-tables?date=${date}&time=${time}`);
      const data = await res.json();
      setTables(data.available || []);
      setLoading(false);
    };
    fetchAvailable();
  }, [date, time]);

  const toggleTable = (tableId) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  useEffect(() => {
    onSelectTables(selectedTableIds);
  }, [selectedTableIds, onSelectTables]);

  const grouped = {
    inside: tables.filter(t => t.zone === 'inside'),
    outside: tables.filter(t => t.zone === 'outside'),
    top: tables.filter(t => t.zone === 'top'),
  };

  if (loading) return <div className="text-center py-8">Checking table availability...</div>;

  return (
    <div>
      <h3 className="font-heading text-xl mb-4">Choose your table</h3>
      <div className="space-y-8">
        {Object.entries(grouped).map(([zone, zoneTables]) => (
          zoneTables.length > 0 && (
            <div key={zone}>
              <h4 className="font-medium text-amber-400 mb-2 capitalize">{zone} seating</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {zoneTables.map(table => (
                  <div
                    key={table.id}
                    onClick={() => toggleTable(table.id)}
                    className={`relative cursor-pointer rounded-xl border-2 transition-all p-3 ${
                      selectedTableIds.includes(table.id)
                        ? 'border-amber-500 bg-amber-600/20'
                        : 'border-white/10 bg-white/5 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{table.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewingTable(table); }}
                        className="text-smoke-400 hover:text-amber-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-smoke-400 mt-1">
                      <Users className="w-3 h-3" /> {table.capacity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
      {viewingTable && <TableViewer table={viewingTable} onClose={() => setViewingTable(null)} />}
    </div>
  );
}