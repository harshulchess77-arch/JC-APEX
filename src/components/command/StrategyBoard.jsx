import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Flag, Battery, Thermometer, Wrench, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const COLUMN_CONFIG = {
  planned:     { label: 'PLANNED',      color: 'text-blue-400',   border: 'border-blue-500/20',   bg: 'bg-blue-500/5',   dot: 'bg-blue-400'  },
  active:      { label: 'IN PROGRESS',  color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', dot: 'bg-yellow-400' },
  done:        { label: 'COMPLETED',    color: 'text-green-400',  border: 'border-green-500/20',  bg: 'bg-green-500/5',  dot: 'bg-green-400'  },
  contingency: { label: 'CONTINGENCY',  color: 'text-primary',    border: 'border-primary/20',    bg: 'bg-primary/5',    dot: 'bg-primary'    },
};

const TYPE_CONFIG = {
  pitstop:   { label: 'Pit Stop',       icon: Wrench,        color: 'text-blue-400',   bg: 'bg-blue-500/10'  },
  battery:   { label: 'Battery Check',  icon: Battery,       color: 'text-green-400',  bg: 'bg-green-500/10' },
  thermal:   { label: 'Thermal Alert',  icon: Thermometer,   color: 'text-yellow-400', bg: 'bg-yellow-500/10'},
  flag:      { label: 'Flag Response',  icon: Flag,          color: 'text-primary',    bg: 'bg-primary/10'   },
  emergency: { label: 'Emergency',      icon: AlertTriangle, color: 'text-primary',    bg: 'bg-primary/15'   },
};

const PRIORITY_STYLE = {
  critical: 'text-primary border-primary/30 bg-primary/10',
  high:     'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  medium:   'text-blue-400 border-blue-500/30 bg-blue-500/10',
  low:      'text-muted-foreground/50 border-border bg-secondary/20',
};

const INITIAL_CARDS = {
  planned: [
    { id: 'c1', type: 'pitstop',  title: 'Lap 5 Pit Window',     detail: 'Check tire pressure + driver check-in', lap: 5, priority: 'medium' },
    { id: 'c2', type: 'battery',  title: 'Battery Status Check', detail: 'Verify drain rate vs projection',        lap: 3, priority: 'high'   },
  ],
  active: [
    { id: 'c3', type: 'thermal',  title: 'Motor Temp Monitor',   detail: 'Watch for >55°C trigger', lap: 0, priority: 'high' },
  ],
  done: [
    { id: 'c4', type: 'pitstop',  title: 'Pre-Race Systems Check', detail: 'All systems verified nominal', lap: 0, priority: 'low' },
  ],
  contingency: [
    { id: 'c5', type: 'emergency', title: 'Battery Critical Protocol', detail: 'If <15%: switch to conserve, signal driver', lap: 0, priority: 'critical' },
    { id: 'c6', type: 'flag',      title: 'Yellow Flag Response',      detail: 'Reduce speed 20%, hold position',            lap: 0, priority: 'medium'   },
  ],
};

let nextId = 100;

export default function StrategyBoard() {
  const [columns, setColumns] = useState(INITIAL_CARDS);
  const [addingTo, setAddingTo] = useState(null);
  const [newCard, setNewCard] = useState({ type: 'pitstop', title: '', detail: '', lap: '', priority: 'medium' });

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const srcCol = [...columns[source.droppableId]];
    const dstCol = source.droppableId === destination.droppableId ? srcCol : [...columns[destination.droppableId]];
    const [moved] = srcCol.splice(source.index, 1);
    dstCol.splice(destination.index, 0, moved);
    setColumns(prev => ({
      ...prev,
      [source.droppableId]: srcCol,
      [destination.droppableId]: dstCol,
    }));
  };

  const deleteCard = (colId, cardId) => {
    setColumns(prev => ({ ...prev, [colId]: prev[colId].filter(c => c.id !== cardId) }));
  };

  const addCard = (colId) => {
    if (!newCard.title.trim()) return;
    const card = { ...newCard, id: `c${++nextId}`, lap: Number(newCard.lap) || 0 };
    setColumns(prev => ({ ...prev, [colId]: [...prev[colId], card] }));
    setNewCard({ type: 'pitstop', title: '', detail: '', lap: '', priority: 'medium' });
    setAddingTo(null);
  };

  const totalItems = Object.values(columns).flat().length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground tracking-wider">STRATEGY BOARD</h2>
          <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">
            Drag &amp; drop pit stop options · Race-day contingency planning
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/30">
          <Clock className="w-3 h-3" />
          {totalItems} ITEMS
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Object.entries(COLUMN_CONFIG).map(([colId, cfg]) => {
            const cards = columns[colId] || [];
            return (
              <div key={colId} className={`rounded border ${cfg.border} ${cfg.bg} flex flex-col`} style={{ minHeight: 320 }}>
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-mono font-bold tracking-[0.2em] ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${cfg.border} ${cfg.color}`}>{cards.length}</span>
                    <button onClick={() => setAddingTo(addingTo === colId ? null : colId)}
                      className={`p-0.5 rounded transition-colors ${cfg.color} opacity-70 hover:opacity-100`}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add form */}
                {addingTo === colId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="px-2.5 pt-2.5 pb-1 border-b border-border/30 bg-card/30 space-y-1.5 overflow-hidden">
                    <select value={newCard.type} onChange={e => setNewCard(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded border border-border bg-background/60 text-foreground font-mono text-[11px] focus:outline-none">
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <input value={newCard.title} onChange={e => setNewCard(p => ({ ...p, title: e.target.value }))} placeholder="Card title..."
                      className="w-full px-2 py-1.5 rounded border border-border bg-background/60 text-foreground font-mono text-[11px] focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/20" />
                    <input value={newCard.detail} onChange={e => setNewCard(p => ({ ...p, detail: e.target.value }))} placeholder="Detail / action..."
                      className="w-full px-2 py-1.5 rounded border border-border bg-background/60 text-foreground font-mono text-[11px] focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/20" />
                    <div className="flex gap-1.5">
                      <input value={newCard.lap} onChange={e => setNewCard(p => ({ ...p, lap: e.target.value }))} placeholder="Lap #" type="number"
                        className="w-20 px-2 py-1.5 rounded border border-border bg-background/60 text-foreground font-mono text-[11px] focus:outline-none" />
                      <select value={newCard.priority} onChange={e => setNewCard(p => ({ ...p, priority: e.target.value }))}
                        className="flex-1 px-2 py-1.5 rounded border border-border bg-background/60 text-foreground font-mono text-[11px] focus:outline-none">
                        {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1.5 pb-1">
                      <button onClick={() => addCard(colId)} className="flex-1 py-1.5 rounded bg-primary/80 text-primary-foreground font-mono text-[11px] font-bold hover:bg-primary transition-colors">ADD</button>
                      <button onClick={() => setAddingTo(null)} className="px-3 py-1.5 rounded border border-border text-muted-foreground font-mono text-[11px] hover:bg-secondary transition-colors">X</button>
                    </div>
                  </motion.div>
                )}

                {/* Droppable cards */}
                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 transition-colors rounded-b ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                      style={{ minHeight: 60 }}
                    >
                      {cards.map((card, index) => {
                        const typeCfg = TYPE_CONFIG[card.type] || TYPE_CONFIG.pitstop;
                        const TypeIcon = typeCfg.icon;
                        return (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`group rounded border border-border bg-card/50 p-2.5 transition-all ${
                                  snapshot.isDragging ? 'shadow-lg border-primary/30 bg-card/90 rotate-1 scale-105' : 'hover:border-border/80 hover:bg-card/70'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div {...provided.dragHandleProps}
                                    className="mt-0.5 text-muted-foreground/20 hover:text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className={`p-1 rounded ${typeCfg.bg} flex-shrink-0`}>
                                        <TypeIcon className={`w-2.5 h-2.5 ${typeCfg.color}`} />
                                      </div>
                                      <span className="text-[11px] font-mono font-bold text-foreground leading-tight truncate">{card.title}</span>
                                    </div>
                                    {card.detail && (
                                      <p className="text-[10px] font-mono text-muted-foreground/50 leading-relaxed mb-1.5">{card.detail}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {card.lap > 0 && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-border text-muted-foreground/40">
                                          LAP {card.lap}
                                        </span>
                                      )}
                                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLE[card.priority]}`}>
                                        {card.priority.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <button onClick={() => deleteCard(colId, card.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-primary transition-all flex-shrink-0 mt-0.5">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-[10px] font-mono text-muted-foreground/20">Drop cards here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}