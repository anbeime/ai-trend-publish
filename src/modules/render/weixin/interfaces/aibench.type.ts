export interface ModelScore {
  name: string;
  score: number;
  reasoning?: number;
  coding?: number;
  math?: number;
  dataAnalysis?: number;
  language?: number;
  if?: number;
  organization?: string;
}

export interface CategoryData {
  name: string;
  icon: string;
  models: ModelScore[];
}

export interface AIBenchTemplate {
  title: string;
  updateTime: string;
  categories: CategoryData[];
  globalTop10: ModelScore[];
}
