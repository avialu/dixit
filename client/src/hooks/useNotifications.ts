import { useEffect, useRef, useState } from 'react';
import { RoomState, PlayerState } from './useGameState';

/**
 * Hook to manage browser notifications and page visibility
 * - Requests notification permissions
 * - Sends notifications when it's the player's turn and they're not viewing the page
 * - Keeps socket alive in background
 * - Opens appropriate modal when notification is clicked
 */
export function useNotifications(
  roomState: RoomState | null,
  playerState: PlayerState | null,
  playerId: string,
  onNotificationClick?: (action: 'openCards' | 'openResults') => void
) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isPageVisible, setIsPageVisible] = useState(true);
  const previousPhaseRef = useRef<string | null>(null);
  const hasNotifiedRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Request permission if not already granted or denied
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);
      console.log('Page visibility changed:', visible ? 'visible' : 'hidden');
      
      // Reset notification flag when user returns to page
      if (visible) {
        hasNotifiedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Send notifications when it's player's turn
  useEffect(() => {
    if (!roomState || !playerState || !playerId) return;
    if (notificationPermission !== 'granted') return;
    if (isPageVisible) return; // Don't notify if they're already looking at the page
    if (hasNotifiedRef.current) return; // Already notified for this phase

    const phase = roomState.phase;
    const isStoryteller = roomState.storytellerId === playerId;
    
    // Detect phase change
    if (phase !== previousPhaseRef.current) {
      previousPhaseRef.current = phase;
      hasNotifiedRef.current = false; // Reset flag for new phase
    }

    let shouldNotify = false;
    let notificationTitle = '';
    let notificationBody = '';
    let actionOnClick: 'openCards' | 'openResults' = 'openCards';

    // Check if it's this player's turn to act
    if (phase === 'STORYTELLER_CHOICE' && isStoryteller && !playerState.mySubmittedCardId) {
      shouldNotify = true;
      notificationTitle = '🎨 Your Turn to be Storyteller!';
      notificationBody = 'Tap to choose a card and give a clue';
      actionOnClick = 'openCards';
    } else if (phase === 'PLAYERS_CHOICE' && !isStoryteller && !playerState.mySubmittedCardId) {
      shouldNotify = true;
      notificationTitle = '🃏 Your Turn to Play!';
      notificationBody = `Tap to choose a card for: "${roomState.currentClue}"`;
      actionOnClick = 'openCards';
    } else if (phase === 'VOTING' && !isStoryteller && !playerState.myVote) {
      shouldNotify = true;
      notificationTitle = '🗳️ Time to Vote!';
      notificationBody = `Tap to vote for: "${roomState.currentClue}"`;
      actionOnClick = 'openCards';
    } else if (phase === 'REVEAL') {
      // Just notify that results are ready
      shouldNotify = true;
      notificationTitle = '📊 Round Complete!';
      notificationBody = 'Tap to see the results';
      actionOnClick = 'openResults';
    }

    if (shouldNotify && !hasNotifiedRef.current) {
      console.log('Sending notification:', notificationTitle, '- Action:', actionOnClick);
      
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'dixit-turn', // Replace previous notification
        requireInteraction: false, // Auto-dismiss after a few seconds
        silent: false,
        data: { action: actionOnClick, phase }, // Store action in notification data
      });

      notification.onclick = () => {
        console.log('Notification clicked - Action:', actionOnClick);
        window.focus();
        notification.close();
        
        // Trigger the appropriate action
        if (onNotificationClick) {
          onNotificationClick(actionOnClick);
        }
      };

      hasNotifiedRef.current = true;
    }
  }, [roomState, playerState, playerId, notificationPermission, isPageVisible, onNotificationClick]);

  return {
    notificationPermission,
    isPageVisible,
    requestNotificationPermission: () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    },
  };
}

