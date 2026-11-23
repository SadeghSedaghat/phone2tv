import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState({}); // messageId -> 'sent' | 'delivered'
  const [notification, setNotification] = useState(null);

  // Initialize socket once
  useEffect(() => {
    // In production or when hosted, socket connects to window.location.origin
    const socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      // If we already have a session, auto-rejoin on reconnect
      const savedCode = localStorage.getItem('phone2tv_session_code');
      const savedDeviceType = localStorage.getItem('phone2tv_device_type') || 'browser';
      const savedDeviceName = localStorage.getItem('phone2tv_device_name') || 'Device';
      
      if (savedCode) {
        socket.emit('join_session', {
          code: savedCode,
          deviceType: savedDeviceType,
          deviceName: savedDeviceName
        });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('session_joined', (data) => {
      setSession(data.session);
      setMessages(data.messages || []);
      setDevices(data.devices || []);
    });

    socket.on('device_connected', (data) => {
      setDevices(data.devices || []);
      if (data.newDevice) {
        setNotification({
          type: 'info',
          title: 'Device Connected',
          message: `${data.newDevice.deviceName || data.newDevice.deviceType} joined the session`
        });
      }
    });

    socket.on('device_disconnected', (data) => {
      setDevices(data.devices || []);
      setNotification({
        type: 'info',
        title: 'Device Disconnected',
        message: `${data.deviceType} left the session`
      });
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [msg, ...prev]; // Latest first
      });

      setDeliveryStatus((prev) => ({
        ...prev,
        [msg.id]: 'delivered'
      }));
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on('session_cleared', () => {
      setMessages([]);
      setNotification({
        type: 'info',
        title: 'Session Cleared',
        message: 'All shared items have been deleted'
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinSession = useCallback((code, deviceType = 'browser', deviceName = 'Device') => {
    if (!socketRef.current) return;
    const cleanCode = code.toString().replace(/[^0-9]/g, '');
    localStorage.setItem('phone2tv_session_code', cleanCode);
    localStorage.setItem('phone2tv_device_type', deviceType);
    localStorage.setItem('phone2tv_device_name', deviceName);

    setConnectionStatus('connecting');
    socketRef.current.emit('join_session', {
      code: cleanCode,
      deviceType,
      deviceName
    });
  }, []);

  const sendMessage = useCallback((payload) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !session) {
        return reject(new Error('Not connected to a session'));
      }

      socketRef.current.emit('send_message', {
        ...payload,
        code: session.code
      }, (response) => {
        if (response && response.success) {
          setDeliveryStatus((prev) => ({
            ...prev,
            [response.message.id]: 'sent'
          }));
          resolve(response.message);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }, [session]);

  const deleteMessage = useCallback((messageId) => {
    if (!socketRef.current || !session) return;
    socketRef.current.emit('delete_message', {
      code: session.code,
      messageId
    });
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, [session]);

  const clearSession = useCallback(() => {
    if (!socketRef.current || !session) return;
    socketRef.current.emit('clear_session', {
      code: session.code
    });
    setMessages([]);
  }, [session]);

  const leaveSession = useCallback(() => {
    localStorage.removeItem('phone2tv_session_code');
    setSession(null);
    setMessages([]);
    setDevices([]);
    window.location.reload();
  }, []);

  const isTvConnected = devices.some(d => d.deviceType === 'tv');
  const isMobileConnected = devices.some(d => d.deviceType === 'mobile');

  return {
    connectionStatus,
    session,
    messages,
    devices,
    isTvConnected,
    isMobileConnected,
    deliveryStatus,
    notification,
    clearNotification: () => setNotification(null),
    joinSession,
    sendMessage,
    deleteMessage,
    clearSession,
    leaveSession
  };
}
