import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '@/lib/supabaseClient';

// Standardized message structures
export const createDownlinkMessage = (sender, type, payload, ackRequired = true) => ({
  id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  sender, // 'PIT' | 'DIRECTOR'
  type, // 'COMMAND' | 'TARGET_PACE' | 'FLAG'
  payload,
  timestamp: Date.now(),
  ackRequired,
});

export const createUplinkMessage = (driverId, telemetry, activeCommand, commandAck) => ({
  driverId,
  telemetry: {
    speed: telemetry.speed,
    volts: telemetry.voltage,
    temp: telemetry.temp,
    lapTime: telemetry.raceTime,
    battery: telemetry.battery,
    lap: telemetry.lap,
  },
  activeCommand,
  commandAck,
  timestamp: Date.now(),
});

export const COMMAND_TYPES = {
  BOX_THIS_LAP: 'BOX_THIS_LAP',
  PACE_UP: 'PACE_UP',
  PACE_DOWN: 'PACE_DOWN',
  TARGET_PACE: 'TARGET_PACE',
  PUSH_HARD: 'PUSH_HARD',
  SAVE_ENERGY: 'SAVE_ENERGY',
  FLAG: 'FLAG',
};

export const COMMAND_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  EXPIRED: 'EXPIRED',
};

export function useRealtimeTelemetry(role = 'driver') {
  const [connectionMode, setConnectionMode] = useState('mock'); // 'websocket', 'supabase', 'mock'
  const [incomingCommands, setIncomingCommands] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [driverTelemetry, setDriverTelemetry] = useState(null);
  const [driverStrategyMode, setDriverStrategyMode] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const socketRef = useRef(null);
  const channelRef = useRef(null);
  const commandTimeoutRef = useRef(null);

  // Initialize connection - Use Supabase directly (skip WebSocket for demo)
  useEffect(() => {
    // Skip WebSocket and go directly to Supabase for production/demo
    trySupabaseConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [role]);

  const trySupabaseConnection = async () => {
    try {
      // Query active flag from database on mount
      if (supabase?.from) {
        supabase.from('race_flags').select('active_flag').eq('id', 1).single().then(({ data }) => {
          if (data?.active_flag) {
            setDriverTelemetry(prev => ({ ...prev, flag: data.active_flag.toLowerCase() }));
          }
        }).catch(() => {});
      }

      const channel = supabase.channel('race_control', {
        config: {
          broadcast: { self: true },
          presence: { key: role },
        },
      });

      // Subscribe to broadcast events
      channel
        .on('broadcast', { event: 'pit_command' }, (payload) => {
          const data = payload?.payload || payload?.data || payload;
          if (role === 'driver' && data) {
            handleIncomingCommand(data);
          }
        })
        .on('broadcast', { event: 'director_command' }, (payload) => {
          const data = payload?.payload || payload?.data || payload;
          if (role === 'driver' && data) {
            handleIncomingCommand(data);
          }
        })
        .on('broadcast', { event: 'driver_ack' }, (payload) => {
          const data = payload?.payload || payload?.data || payload;
          if ((role === 'pit' || role === 'director') && data) {
            handleDriverAck(data);
          }
        })
        .on('broadcast', { event: 'driver_status' }, (payload) => {
          if (role === 'pit' || role === 'director') {
            if (payload?.payload?.telemetry) {
              setDriverTelemetry(payload.payload.telemetry);
            } else if (payload?.data?.telemetry) {
              setDriverTelemetry(payload.data.telemetry);
            }
          }
        })
        .on('broadcast', { event: 'flag_change' }, (payload) => {
          const flagData = payload?.payload?.flag || payload?.data?.flag || payload?.flag;
          if (flagData) {
            setDriverTelemetry(prev => ({ ...prev, flag: String(flagData).toLowerCase() }));
          }
        })
        .on('broadcast', { event: 'strategy_change' }, (payload) => {
          const modeData = payload?.payload?.mode || payload?.data?.mode || payload?.mode;
          if (modeData) {
            setDriverStrategyMode(String(modeData).toUpperCase());
          }
        });

      // Listen to Supabase table changes if enabled
      if (supabase?.channel) {
        channel
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commands' }, (payload) => {
            if (payload.new && role === 'driver') {
              handleIncomingCommand({
                id: payload.new.id,
                sender: 'PIT',
                type: payload.new.command_name,
                payload: payload.new.command_name,
                status: payload.new.status,
                timestamp: new Date(payload.new.created_at).getTime(),
              });
            }
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commands' }, (payload) => {
            if (payload.new && payload.new.status === 'ACKNOWLEDGED') {
              handleDriverAck({
                commandId: payload.new.id,
                commandText: payload.new.command_name,
                timestamp: new Date(payload.new.acknowledged_at || Date.now()).getTime(),
              });
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'race_flags' }, (payload) => {
            if (payload.new && payload.new.active_flag) {
              setDriverTelemetry(prev => ({ ...prev, flag: payload.new.active_flag.toLowerCase() }));
            }
          });
      }

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Supabase Realtime connected');
          setConnectionMode('supabase');
          channelRef.current = channel;
        }
      });
    } catch (error) {
      console.error('Supabase connection failed:', error);
      setConnectionMode('mock');
    }
  };

  const handleIncomingCommand = useCallback((commandData) => {
    if (!commandData) return;
    const normalized = {
      ...commandData,
      id: commandData.id || `cmd_${Date.now()}`,
      payload: commandData.payload || commandData.commandText || commandData.command_name || commandData.text || commandData.type,
      sender: commandData.sender || 'PIT',
      status: COMMAND_STATUS.DELIVERED,
    };

    setIncomingCommands(prev => {
      // Avoid duplicate commands by id
      if (prev.some(c => c.id === normalized.id)) return prev;
      return [normalized, ...prev];
    });
    
    // Auto-expire commands after 30 seconds if not acknowledged
    if (commandData.ackRequired !== false) {
      commandTimeoutRef.current = setTimeout(() => {
        setIncomingCommands(prev => 
          prev.map(cmd => 
            cmd.id === normalized.id ? { ...cmd, status: COMMAND_STATUS.EXPIRED } : cmd
          )
        );
      }, 30000);
    }
  }, []);

  const handleDriverAck = useCallback((ackData) => {
    if (!ackData || (!ackData.commandId && !ackData.commandText)) {
      console.error('[handleDriverAck] Invalid ackData:', ackData);
      return;
    }

    try {
      setCommandHistory(prev =>
        prev.map(cmd => {
          const match = (ackData.commandId && cmd.id === ackData.commandId) ||
                        (ackData.commandText && (cmd.payload === ackData.commandText || cmd.type === ackData.commandText));
          return match
            ? { ...cmd, status: COMMAND_STATUS.ACKNOWLEDGED, ackedAt: ackData.timestamp || Date.now() }
            : cmd;
        })
      );
    } catch (error) {
      console.error('[handleDriverAck] Error updating command history:', error);
    }
  }, []);

  // Send command (for pit/director)
  const sendCommand = useCallback((type, payload) => {
    const sender = role === 'pit' ? 'PIT' : 'DIRECTOR';
    const commandText = payload || type;
    const command = createDownlinkMessage(sender, type, commandText, true);

    setCommandHistory(prev => [...prev, { ...command, status: COMMAND_STATUS.SENT }]);

    // Persist to Supabase commands table
    if (supabase?.from) {
      supabase.from('commands').insert({
        session_id: 'race-session-48v',
        command_name: commandText,
        status: 'PENDING',
      }).then(() => {}).catch(err => console.debug('[sendCommand] Supabase insert note:', err?.message));
    }

    if (connectionMode === 'websocket' && socketRef.current) {
      try {
        const event = role === 'pit' ? 'pit_command' : 'director_command';
        socketRef.current.emit(event, command);
      } catch (error) {
        console.error('[sendCommand] WebSocket emit error:', error);
      }
    } else if (connectionMode === 'supabase' && channelRef.current) {
      try {
        const event = role === 'pit' ? 'pit_command' : 'director_command';
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload: command,
        });
      } catch (error) {
        console.error('[sendCommand] Supabase send error:', error);
      }
    } else {
      console.log('Mock mode - command logged locally:', command);
    }

    return command;
  }, [role, connectionMode]);

  // Send acknowledgment (for driver)
  const sendAck = useCallback((commandId, commandText) => {
    if (!commandId && !commandText) {
      console.error('[sendAck] Invalid ack target:', { commandId, commandText });
      return;
    }

    const ack = {
      commandId: commandId || `ack_${Date.now()}`,
      commandText: commandText || '',
      status: COMMAND_STATUS.ACKNOWLEDGED,
      timestamp: Date.now(),
    };

    // Remove from incoming commands queue immediately
    setIncomingCommands(prev => prev.filter(cmd => (commandId && cmd.id !== commandId) || (commandText && cmd.payload !== commandText)));

    // Persist acknowledgment to Supabase commands table
    if (supabase?.from) {
      const updateData = {
        status: 'ACKNOWLEDGED',
        acknowledged_at: new Date().toISOString(),
      };
      if (typeof commandId === 'number' || /^\d+$/.test(String(commandId))) {
        supabase.from('commands').update(updateData).eq('id', Number(commandId)).then(() => {}).catch(() => {});
      } else if (commandText) {
        supabase.from('commands').update(updateData).eq('command_name', commandText).then(() => {}).catch(() => {});
      } else {
        supabase.from('commands').update(updateData).order('created_at', { ascending: false }).limit(1).then(() => {}).catch(() => {});
      }
    }

    if (connectionMode === 'websocket' && socketRef.current) {
      try {
        socketRef.current.emit('driver_ack', ack);
      } catch (error) {
        console.error('[sendAck] WebSocket emit error:', error);
      }
    } else if (connectionMode === 'supabase' && channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'driver_ack',
          payload: ack,
        });
      } catch (error) {
        console.error('[sendAck] Supabase send error:', error);
      }
    } else {
      console.log('Mock mode - acknowledgment logged locally:', ack);
    }
  }, [connectionMode]);

  // Broadcast driver status (for driver)
  const broadcastDriverStatus = useCallback((telemetry, activeCommand = null) => {
    const status = createUplinkMessage('driver-1', telemetry, activeCommand, null);

    if (connectionMode === 'websocket' && socketRef.current) {
      socketRef.current.emit('driver_status', status);
    } else if (connectionMode === 'supabase' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'driver_status',
        payload: status,
      });
    }
  }, [connectionMode]);

  // Broadcast flag change (for pit/director)
  const broadcastFlagChange = useCallback((flag) => {
    const flagUpper = String(flag).toUpperCase();
    if (supabase?.from) {
      supabase.from('race_flags').update({
        active_flag: flagUpper,
        updated_at: new Date().toISOString(),
      }).eq('id', 1).then(() => {}).catch(err => console.debug('[broadcastFlagChange] DB note:', err?.message));
    }

    if (connectionMode === 'supabase' && channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'flag_change',
          payload: { flag: flagUpper },
        });
      } catch (error) {
        console.error('[broadcastFlagChange] Supabase send error:', error);
      }
    } else {
      console.log('Mock mode - flag change logged locally:', flag);
    }
  }, [connectionMode]);

  // Broadcast strategy change (for pit)
  const broadcastStrategyChange = useCallback((mode) => {
    const modeUpper = String(mode).toUpperCase();
    if (connectionMode === 'supabase' && channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'strategy_change',
          payload: { mode: modeUpper },
        });
      } catch (error) {
        console.error('[broadcastStrategyChange] Supabase send error:', error);
      }
    } else {
      console.log('Mock mode - strategy change logged locally:', modeUpper);
    }
  }, [connectionMode]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    connectionMode,
    isOnline,
    incomingCommands,
    commandHistory,
    driverTelemetry,
    driverStrategyMode,
    setDriverStrategyMode,
    sendCommand,
    sendAck,
    broadcastDriverStatus,
    broadcastFlagChange,
    broadcastStrategyChange,
  };
}
