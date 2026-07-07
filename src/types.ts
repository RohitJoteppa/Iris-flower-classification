export type Species = 'Iris-setosa' | 'Iris-versicolor' | 'Iris-virginica';

export interface IrisRecord {
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
  species: Species;
  id: number;
}

export type ClassifierType = 'knn' | 'decision-tree' | 'perceptron';

export interface KNNParams {
  k: number;
  distanceMetric: 'euclidean' | 'manhattan';
}

export interface DecisionTreeParams {
  maxDepth: number;
  minSamplesSplit: number;
}

export interface PerceptronParams {
  learningRate: number;
  epochs: number;
}

export interface TrainingResult {
  accuracy: number;
  confusionMatrix: Record<Species, Record<Species, number>>;
  precision: Record<Species, number>;
  recall: Record<Species, number>;
  f1Score: Record<Species, number>;
  // Classifier functions or structure
  predict: (record: Omit<IrisRecord, 'species' | 'id'>) => Species;
  trainingLogs?: { epoch: number; loss: number; accuracy: number }[];
}

export type FeatureKey = 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  sepalLength: 'Sepal Length (cm)',
  sepalWidth: 'Sepal Width (cm)',
  petalLength: 'Petal Length (cm)',
  petalWidth: 'Petal Width (cm)',
};

export const SPECIES_COLORS: Record<Species, string> = {
  'Iris-setosa': '#3b82f6', // blue
  'Iris-versicolor': '#10b981', // emerald
  'Iris-virginica': '#ec4899', // pink/magenta
};

export const SPECIES_BG_COLORS: Record<Species, string> = {
  'Iris-setosa': 'rgba(59, 130, 246, 0.15)',
  'Iris-versicolor': 'rgba(16, 185, 129, 0.15)',
  'Iris-virginica': 'rgba(236, 72, 153, 0.15)',
};

export const SPECIES_LABELS: Record<Species, string> = {
  'Iris-setosa': 'Setosa',
  'Iris-versicolor': 'Versicolor',
  'Iris-virginica': 'Virginica',
};
