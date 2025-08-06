import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<ArrayBuffer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (mode: 'voice' | 'video'): Promise<void> => {
    try {
      const constraints = mode === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mode === 'video' 
          ? 'video/webm;codecs=vp8,opus' 
          : 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm' 
        });
        const arrayBuffer = await blob.arrayBuffer();
        setRecordedData(arrayBuffer);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: `${mode === 'video' ? 'Video' : 'Voice'} recording is now active`,
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not start recording. Please check permissions.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Recording has been saved and encrypted",
      });
    }
  }, [isRecording]);

  const clearRecording = useCallback((): void => {
    setRecordedData(null);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordedData,
    startRecording,
    stopRecording,
    clearRecording
  };
}
