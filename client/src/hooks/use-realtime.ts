import { useEffect, useState } from 'react';
import { getWebSocketManager, type WebSocketMessage } from '@/lib/websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsManager = getWebSocketManager();

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(wsManager.getConnectionStatus());
    };
    
    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    // Subscribe to real-time events
    const unsubscribers = [
      wsManager.subscribe('athletes_synced', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "Athletes Synced",
          description: `${data.length} athletes synchronized from Google Sheets`,
        });
      }),

      wsManager.subscribe('athlete_created', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "Athlete Added",
          description: `${data.nama_lengkap} has been added`,
        });
      }),

      wsManager.subscribe('attendance_updated', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/anti-clash/available'] });
        toast({
          title: "Attendance Updated",
          description: `${data.nama_lengkap} marked as ${data.isPresent ? 'present' : 'absent'}`,
        });
      }),

      wsManager.subscribe('athlete_status_updated', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/anti-clash/competing'] });
        queryClient.invalidateQueries({ queryKey: ['/api/anti-clash/available'] });
        toast({
          title: "Status Updated",
          description: `${data.nama_lengkap} status: ${data.status}`,
        });
      }),

      wsManager.subscribe('match_created', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/active-matches'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "Match Started",
          description: `New match created in ${data.ring}`,
        });
      }),

      wsManager.subscribe('winner_declared', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/active-matches'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
        toast({
          title: "Winner Declared",
          description: "Match completed successfully",
        });
      }),

      wsManager.subscribe('category_created', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "Category Created",
          description: `${data.name} category added`,
        });
      })
    ];

    return () => {
      clearInterval(interval);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient, toast, wsManager]);

  return {
    isConnected,
    sendMessage: (message: WebSocketMessage) => wsManager.send(message)
  };
}
