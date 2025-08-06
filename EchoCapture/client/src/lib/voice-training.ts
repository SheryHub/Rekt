import { VoiceSample } from '@shared/schema';

export class VoiceTrainer {
  private samples: VoiceSample[] = [];

  addSample(sample: VoiceSample): void {
    this.samples.push(sample);
  }

  getSamples(): VoiceSample[] {
    return this.samples;
  }

  clearSamples(): void {
    this.samples = [];
  }

  // Simple voice pattern matching using audio characteristics
  matchesPattern(audioData: ArrayBuffer, phrase: string): boolean {
    // This is a simplified implementation
    // In a real app, you would use more sophisticated audio analysis
    
    if (this.samples.length === 0) {
      return false;
    }

    const currentSamples = this.samples.filter(s => s.phrase === phrase);
    if (currentSamples.length === 0) {
      return false;
    }

    // Basic audio length comparison (in a real implementation, you'd use FFT, MFCC, etc.)
    const inputLength = audioData.byteLength;
    const averageLength = currentSamples.reduce((sum, sample) => sum + sample.audioData.byteLength, 0) / currentSamples.length;
    
    // Allow 30% variance in audio length
    const variance = 0.3;
    const minLength = averageLength * (1 - variance);
    const maxLength = averageLength * (1 + variance);
    
    return inputLength >= minLength && inputLength <= maxLength;
  }

  getTrainingProgress(): number {
    return Math.min(this.samples.length, 5);
  }

  isTrainingComplete(): boolean {
    return this.samples.length >= 5;
  }
}

export const voiceTrainer = new VoiceTrainer();
