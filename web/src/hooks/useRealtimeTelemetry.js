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
      const channel = supabase.channel('race_control', {
        config: {
          broadcast: { self: true },
          presence: { key: role },
        },
      });

      // Subscribe to broadcast events
      channel
        .on('broadcast', { event: 'pit_command' }, (payload) => {
          if (role === 'driver') {
            handleIncomingCommand(payload.data);
          }
        })
        .on('broadcast', { event: 'director_command' }, (payload) => {
          if (role === 'driver') {
            handleIncomingCommand(payload.data);
          }
        })
        .on('broadcast', { event: 'driver_ack' }, (payload) => {
          if (role === 'pit' || role === 'director') {
            handleDriverAck(payload.data);
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
          if (role === 'driver') {
            if (payload?.payload?.flag) {
              setDriverTelemetry(prev => ({ ...prev, flag: payload.payload.flag }));
            }
          }
        })
        .subscribe((status) => {
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
    setIncomingCommands(prev => [...prev, { ...commandData, status: COMMAND_STATUS.DELIVERED }]);
    
    // Auto-expire commands after 30 seconds if not acknowledged
    if (commandData.ackRequired) {
      commandTimeoutRef.current = setTimeout(() => {
        setIncomingCommands(prev => 
          prev.map(cmd => 
            cmd.id === commandData.id ? { ...cmd, status: COMMAND_STATUS.EXPIRED } : cmd
          )
        );
      }, 30000);
    }
  }, []);

  const handleDriverAck = useCallback((ackData) => {
    if (!ackData || !ackData.commandId) {
      console.error('[handleDriverAck] Invalid ackData:', ackData);
      return;
    }

    try {
      setCommandHistory(prev =>
        prev.map(cmd =>
          cmd.id === ackData.commandId
            ? { ...cmd, status: COMMAND_STATUS.ACKNOWLEDGED, ackedAt: ackData.timestamp }
            : cmd
        )
      );
    } catch (error) {
      console.error('[handleDriverAck] Error updating command history:', error);
    }
  }, []);

  // Send command (for pit/director)
  const sendCommand = useCallback((type, payload) => {
    const sender = role === 'pit' ? 'PIT' : 'DIRECTOR';
    const command = createDownlinkMessage(sender, type, payload, true);

    setCommandHistory(prev => [...prev, { ...command, status: COMMAND_STATUS.SENT }]);

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
  const sendAck = useCallback((commandId) => {
    if (!commandId) {
      console.error('[sendAck] Invalid commandId:', commandId);
      return;
    }

    const ack = {
      commandId,
      status: COMMAND_STATUS.ACKNOWLEDGED,
      timestamp: Date.now(),
    };

    // Remove from incoming commands
    setIncomingCommands(prev => prev.filter(cmd => cmd.id !== commandId));

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
    if (connectionMode === 'supabase' && channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'flag_change',
          payload: { flag },
        });
      } catch (error) {
        console.error('[broadcastFlagChange] Supabase send error:', error);
      }
    } else {
      console.log('Mock mode - flag change logged locally:', flag);
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
    sendCommand,
    sendAck,
    broadcastDriverStatus,
    broadcastFlagChange,
  };
}
