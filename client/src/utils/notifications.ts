/**
 * Turn notification system - works on both iOS and Android
 * 
 * - Android: Vibration + Sound
 * - iOS: Sound only (vibration not supported in Safari)
 * - Both: Visual flash as fallback
 * 
 * Audio must be "unlocked" by user interaction first (e.g., tapping Join button)
 */

let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Call this on any user interaction to unlock audio on iOS
 * Should be called on join, card selection, etc.
 */
export function unlockAudio() {
  if (isAudioUnlocked) return;
  
  try {
    // Create and immediately close an audio context to unlock
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    // iOS requires resume after user gesture
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        isAudioUnlocked = true;
        console.log('Audio unlocked for notifications');
      });
    } else {
      isAudioUnlocked = true;
    }
    
    // Play a silent sound to fully unlock on iOS
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.log('Could not unlock audio:', e);
  }
}

/**
 * Notify player it's their turn
 * Uses vibration (Android) + sound (both) + visual flash (fallback)
 */
export function notifyTurn() {
  // Try vibration (Android only - iOS doesn't support it)
  tryVibrate();
  
  // Play notification sound
  playNotificationSound();
  
  // Visual flash as universal fallback
  flashScreen();
}

/**
 * Try to vibrate (works on Android, no-op on iOS)
 */
function tryVibrate() {
  try {
    if ('vibrate' in navigator) {
      // Double pulse pattern: vibrate, pause, vibrate
      navigator.vibrate([100, 50, 100]);
    }
  } catch (e) {
    // Vibration not supported
  }
}

/**
 * Play a pleasant notification ping sound
 */
function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    // Resume if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const now = audioContext.currentTime;
    
    // Create two oscillators for a richer "ping" sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Two-tone ping (like a doorbell)
    osc1.frequency.value = 880;  // A5
    osc2.frequency.value = 1108; // C#6 (major third above)
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    // Volume envelope - quick attack, smooth decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
    
  } catch (e) {
    console.log('Could not play notification sound:', e);
  }
}

/**
 * Brief visual flash as a fallback notification
 * Works even when sound is muted
 */
function flashScreen() {
  try {
    // Create a full-screen flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(74, 144, 226, 0.3);
      pointer-events: none;
      z-index: 99999;
      animation: notificationFlash 0.4s ease-out forwards;
    `;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('notification-flash-style')) {
      const style = document.createElement('style');
      style.id = 'notification-flash-style';
      style.textContent = `
        @keyframes notificationFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(flash);
    
    // Remove after animation
    setTimeout(() => {
      flash.remove();
    }, 400);
  } catch (e) {
    // Flash not critical
  }
}



