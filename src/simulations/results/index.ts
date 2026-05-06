import raw from "./data.json";
import type { SampleResult } from "../types";

export const SAMPLE_RESULTS: readonly SampleResult[] = raw as readonly SampleResult[];

export const findSampleById = (id: string): SampleResult | undefined =>
  SAMPLE_RESULTS.find((s) => s.scenario.id === id);
