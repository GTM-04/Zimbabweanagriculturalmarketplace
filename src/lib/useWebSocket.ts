// ============================================================================
// WebSocket Hook for Real-time Chat
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingApi } from './api';
import type { Message, SendMessageRequest, SendReadReceiptRequest, SendTypingRequest, WebSocketMessage } from './types';

interface UseWebSocketOptions {
  conversationId: string;
  onMessage?: (message: Message) => void;
  onTyping?: (userId: string, userName: string, isTyping: boolean) => void;
  onReadReceipt?: (messageId: string, userId: string) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = ({
  conversationId,
  onMessage,
  onTyping,
  onReadReceipt,
  onError,
}: UseWebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!conversationId) return;

    try {
      ws.current = messagingApi.connectWebSocket(conversationId);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setReconnectAttempts(0);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          switch (data.type) {
            case 'chat_message':
              if (data.message && onMessage) {
                onMessage(data.message);
              }
              break;

            case 'typing':
              if (data.user_id && data.user_name !== undefined && data.is_typing !== undefined && onTyping) {
                onTyping(data.user_id, data.user_name, data.is_typing);
              }
              break;

            case 'read_receipt':
              if (data.message_id && data.user_id && onReadReceipt) {
                onReadReceipt(data.message_id, data.user_id);
              }
              break;

            case 'error':
              if (data.error && onError) {
                onError(data.error);
              }
              break;

            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError('WebSocket connection error');
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`Reconnecting in ${delay}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          if (onError) {
            onError('Failed to connect to chat server');
          }
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (onError) {
        onError('Failed to establish connection');
      }
    }
  }, [conversationId, reconnectAttempts, onMessage, onTyping, onReadReceipt, onError]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      // Cleanup
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Send chat message
  const sendMessage = useCallback((text: string, clientId?: string) => {
    if (ws.current && connected && text.trim()) {
      const message: SendMessageRequest = {
        type: 'chat_message',
        message: text,
        client_id: clientId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      ws.current.send(JSON.stringify(message));
      return message.client_id;
    }
    return null;
  }, [connected]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (ws.current && connected) {
      const message: SendTypingRequest = {
        type: 'typing',
        is_typing: isTyping,
      };
      ws.current.send(JSON.stringify(message));
    }
  }, [connected]);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: string) => {
    if (ws.current && connected) {
      const message: SendReadReceiptRequest = {
        type: 'read_receipt',
        message_id: messageId,
      };
      ws.current.send(JSON.stringify(message));
    }
  }, [connected]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
    }
    setConnected(false);
  }, []);

  return {
    connected,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    reconnect,
    disconnect,
  };
};
