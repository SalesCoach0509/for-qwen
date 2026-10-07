import { PostInteractionAnalysis } from './types';
import { v4 as uuidv4 } from 'uuid';

function lineNumbers(reference: string): number[] {
  const match = reference.match(/\bline\s+(\d+)(?:\s*[-–]\s*(\d+))?/i);
  if (!match) return [];
  const start = Number(match[1]);
  const end = Math.min(Number(match[2] || match[1]), start + 4);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export function groundTranscriptAnalysis(analysis: PostInteractionAnalysis, transcript: string, sourceId: string): PostInteractionAnalysis {
  const lines = transcript.split(/\r?\n/);
  const diagnosis = analysis.capabilityDiagnosis.map(score => {
    const evidence = score.evidence.filter(item => {
      if (item.observationType === 'recommended' || item.source === 'inference') return false;
      return lineNumbers(item.lineReference || '').some(n => n >= 1 && n <= lines.length && lines[n - 1].trim());
    }).map(item => {
      const n = lineNumbers(item.lineReference || '')[0];
      const sourceText = lines[n - 1].trim();
      return {
        ...item,
        evidenceId: item.evidenceId || uuidv4(),
        interactionId: analysis.interactionId,
        sourceType: 'TRANSCRIPT' as const,
        sourceId,
        speaker: sourceText.split(':')[0] || 'Unknown',
        sourceText,
        behaviorObserved: item.statement,
        classification: item.observationType === 'inferred' ? 'INFERRED' as const : 'OBSERVED' as const,
      };
    });
    return { ...score, evidence, score: evidence.length ? score.score : 0, confidence: evidence.length ? score.confidence : 0 };
  });

  const planVsActual = analysis.planVsActual.map(row => {
    const refs = lineNumbers(row.actual);
    const sourceText = refs.map(n => lines[n - 1]?.trim()).filter(Boolean).join(' ');
    return {
      ...row,
      sourceText: sourceText || undefined,
      observation: sourceText ? 'OBSERVED' as const : /\b(no|not|did not|none)\b/i.test(row.actual)
        ? 'NOT_OBSERVED' as const : 'INSUFFICIENT_EVIDENCE' as const,
      evidenceIds: diagnosis.flatMap(d => d.evidence).filter(e => refs.some(n => e.lineReference?.includes(String(n)))).map(e => e.evidenceId!),
    };
  });
  return { ...analysis, capabilityDiagnosis: diagnosis, planVsActual };
}
