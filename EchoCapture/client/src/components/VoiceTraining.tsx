import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Mic } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { voiceTrainer } from '@/lib/voice-training';
import { localStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

interface VoiceTrainingProps {
  phrase: string;
  onComplete: () => void;
}

export function VoiceTraining({ phrase, onComplete }: VoiceTrainingProps) {
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const { startRecording, stopRecording, recordedData, isRecording, clearRecording } = useMediaRecorder();

  const recordTrainingSample = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      setIsRecordingSample(false);
    } else {
      try {
        await startRecording('voice');
        setIsRecordingSample(true);
        
        // Auto stop after 3 seconds
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
            setIsRecordingSample(false);
          }
        }, 3000);
      } catch (error) {
        toast({
          title: "Recording failed",
          description: "Could not start voice recording for training",
          variant: "destructive"
        });
      }
    }
  }, [isRecording, startRecording, stopRecording]);

  React.useEffect(() => {
    const processSample = async () => {
      if (recordedData && !isRecording) {
        try {
          const sample = {
            id: crypto.randomUUID(),
            phrase,
            audioData: recordedData,
            timestamp: Date.now()
          };

          // Add to trainer
          voiceTrainer.addSample(sample);
          
          // Save to storage
          await localStorage.saveVoiceSample(sample);

          const newProgress = voiceTrainer.getTrainingProgress();
          setTrainingProgress(newProgress);

          toast({
            title: "Sample recorded",
            description: `Progress: ${newProgress}/5 samples`,
          });

          clearRecording();

          if (voiceTrainer.isTrainingComplete()) {
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        } catch (error) {
          toast({
            title: "Save failed",
            description: "Could not save voice sample",
            variant: "destructive"
          });
        }
      }
    };

    processSample();
  }, [recordedData, isRecording, phrase, clearRecording, onComplete]);

  const skipTraining = () => {
    toast({
      title: "Training skipped",
      description: "Using default voice recognition patterns",
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-medium mb-2">Voice Training</h2>
              <p className="text-sm text-muted-foreground">
                Record your voice phrase 5 times to train the AI model. Say "{phrase}" clearly each time.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="text-lg font-bold">{trainingProgress} / 5</div>
              </div>
              
              <div className="flex justify-center gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < trainingProgress ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <p className="text-center text-sm font-medium">Say: "{phrase}"</p>
              </div>
              
              <Button
                className={`w-48 h-48 mx-auto rounded-full ${
                  isRecordingSample ? 'recording-pulse' : ''
                }`}
                onClick={recordTrainingSample}
                disabled={isRecording && !isRecordingSample}
              >
                <div className="flex flex-col items-center">
                  <Mic className="h-12 w-12 mb-2" />
                  <span className="text-lg font-bold">
                    {isRecordingSample ? 'RECORDING...' : 'RECORD'}
                  </span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={skipTraining}
              >
                Skip Training (Use Default)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
