import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface VoiceRecognitionConfig {
  startPhrase: string;
  stopPhrase: string;
  onActivation: (phrase: string) => void;
  isEnabled: boolean;
}

export function useVoiceRecognition({
  startPhrase,
  stopPhrase,
  onActivation,
  isEnabled
}: VoiceRecognitionConfig) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          
          if (transcript.includes(startPhrase.toLowerCase())) {
            onActivation('start');
          } else if (transcript.includes(stopPhrase.toLowerCase())) {
            onActivation('stop');
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice activation",
            variant: "destructive"
          });
        }
      };

      recognition.onend = () => {
        if (isEnabled && isListening) {
          // Restart recognition if it stops unexpectedly
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startPhrase, stopPhrase, onActivation, isEnabled, isListening]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive"
      });
      return;
    }

    if (!recognitionRef.current) {
      return;
    }

    try {
      await recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast({
        title: "Voice recognition failed",
        description: "Could not start voice recognition",
        variant: "destructive"
      });
    }
  }, [isSupported]);

  const stopListening = useCallback((): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Auto start/stop based on isEnabled
  useEffect(() => {
    if (isEnabled && !isListening && isSupported) {
      startListening();
    } else if (!isEnabled && isListening) {
      stopListening();
    }
  }, [isEnabled, isListening, isSupported, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
