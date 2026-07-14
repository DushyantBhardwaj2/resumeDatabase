import type { IConfidenceService, ConfidenceSource } from "../ports/system-confidence"

export class ConfidenceService implements IConfidenceService {
  compute(source: ConfidenceSource): number {
    switch (source.type) {
      case "MANUAL":
        return 0.99
      case "GITHUB_API":
        if (source.dataPrecision === "EXACT") return 0.99
        if (source.dataPrecision === "FILE_PARSE") return 0.95
        return 0.80
      case "PDF_PARSE":
        return source.extractionMethod === "STRUCTURED" ? 0.92 : 0.75
      case "AI_CONVERSATION":
        if (source.explicitness === "EXPLICIT") return 0.88
        if (source.explicitness === "IMPLICIT") return 0.82
        return 0.70
      case "README_HEURISTIC":
        return 0.61
      case "AI_GENERATED":
        return 0.70
      default:
        return 0.50
    }
  }

  getLabel(confidence: number): "high" | "medium" | "low" {
    if (confidence >= 0.90) return "high"
    if (confidence >= 0.70) return "medium"
    return "low"
  }

  getColor(confidence: number): "green" | "amber" | "gray" {
    if (confidence >= 0.90) return "green"
    if (confidence >= 0.70) return "amber"
    return "gray"
  }
}
