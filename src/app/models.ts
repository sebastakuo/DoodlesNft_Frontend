
export interface AttributeConfig {
  key: string;
  label: string;
  defaultPrompt: string;
}

export interface GlobalAttributeConfig extends AttributeConfig {}

export interface Attribute extends AttributeConfig {
  isActive: boolean;
  promptValue: string;
  aiKeyword: string;
  referencePreviewUrl: string | null;
}

export interface AIAnalysisData {
  characterDescription: string;
  poseDescription: string;
  styleDescription: string;
  backgroundDescription: string;
  skinTypeDescription: string;
  clothingDescription: string;
  headDescription: string;
  eyesDescription: string;
  mouthDescription: string;
  accessoryDescription: string;
}

export interface GeneratedResult {
  id: number;
  isLoading: boolean;
  imageUrl?: string;
  error?: string;
}
