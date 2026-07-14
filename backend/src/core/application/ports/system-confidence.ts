export interface ConfidenceSource {
  type: "MANUAL" | "GITHUB_API" | "PDF_PARSE" | "AI_CONVERSATION" | "README_HEURISTIC" | "AI_GENERATED"
  dataPrecision?: "EXACT" | "FILE_PARSE" | "HEURISTIC"
  extractionMethod?: "STRUCTURED" | "INFERRED"
  explicitness?: "EXPLICIT" | "IMPLICIT" | "INFERRED"
}

export interface IConfidenceService {
  compute(source: ConfidenceSource): number
  getLabel(confidence: number): "high" | "medium" | "low"
  getColor(confidence: number): "green" | "amber" | "gray"
}
