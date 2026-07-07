import { IrisRecord, Species, TrainingResult, KNNParams, DecisionTreeParams, PerceptronParams } from './types';

// Helper to calculate min/max for normalization
export interface Normalizer {
  min: { sepalLength: number; sepalWidth: number; petalLength: number; petalWidth: number };
  max: { sepalLength: number; sepalWidth: number; petalLength: number; petalWidth: number };
}

export function getNormalizer(data: IrisRecord[]): Normalizer {
  const norm: Normalizer = {
    min: { sepalLength: Infinity, sepalWidth: Infinity, petalLength: Infinity, petalWidth: Infinity },
    max: { sepalLength: -Infinity, sepalWidth: -Infinity, petalLength: -Infinity, petalWidth: -Infinity },
  };

  data.forEach((r) => {
    norm.min.sepalLength = Math.min(norm.min.sepalLength, r.sepalLength);
    norm.max.sepalLength = Math.max(norm.max.sepalLength, r.sepalLength);
    norm.min.sepalWidth = Math.min(norm.min.sepalWidth, r.sepalWidth);
    norm.max.sepalWidth = Math.max(norm.max.sepalWidth, r.sepalWidth);
    norm.min.petalLength = Math.min(norm.min.petalLength, r.petalLength);
    norm.max.petalLength = Math.max(norm.max.petalLength, r.petalLength);
    norm.min.petalWidth = Math.min(norm.min.petalWidth, r.petalWidth);
    norm.max.petalWidth = Math.max(norm.max.petalWidth, r.petalWidth);
  });

  return norm;
}

export function normalize(val: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (val - min) / (max - min);
}

// Evaluate predictions on a test set to produce metrics
export function evaluateClassifier(
  testData: IrisRecord[],
  predictFn: (record: Omit<IrisRecord, 'species' | 'id'>) => Species
): Omit<TrainingResult, 'predict' | 'trainingLogs'> {
  const classes: Species[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
  
  // Initialize confusion matrix
  const confusionMatrix: Record<Species, Record<Species, number>> = {
    'Iris-setosa': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
    'Iris-versicolor': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
    'Iris-virginica': { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 },
  };

  let correctCount = 0;

  testData.forEach((record) => {
    const pred = predictFn(record);
    const actual = record.species;
    if (confusionMatrix[actual] && confusionMatrix[actual][pred] !== undefined) {
      confusionMatrix[actual][pred]++;
    }
    if (pred === actual) {
      correctCount++;
    }
  });

  const accuracy = testData.length > 0 ? correctCount / testData.length : 0;

  const precision: Record<Species, number> = { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 };
  const recall: Record<Species, number> = { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 };
  const f1Score: Record<Species, number> = { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 };

  classes.forEach((species) => {
    // True Positives
    const tp = confusionMatrix[species][species];
    
    // False Positives: predicted species, but actually other species
    let fp = 0;
    classes.forEach((other) => {
      if (other !== species) {
        fp += confusionMatrix[other][species];
      }
    });

    // False Negatives: actually species, but predicted other species
    let fn = 0;
    classes.forEach((other) => {
      if (other !== species) {
        fn += confusionMatrix[species][other];
      }
    });

    precision[species] = tp + fp > 0 ? tp / (tp + fp) : 0;
    recall[species] = tp + fn > 0 ? tp / (tp + fn) : 0;
    f1Score[species] =
      precision[species] + recall[species] > 0
        ? (2 * precision[species] * recall[species]) / (precision[species] + recall[species])
        : 0;
  });

  return {
    accuracy,
    confusionMatrix,
    precision,
    recall,
    f1Score,
  };
}

// 1. K-NEAREST NEIGHBORS (k-NN)
export function trainKNN(
  trainData: IrisRecord[],
  testData: IrisRecord[],
  params: KNNParams
): TrainingResult {
  const norm = getNormalizer(trainData);

  const predict = (record: Omit<IrisRecord, 'species' | 'id'>): Species => {
    const distances = trainData.map((trainItem) => {
      // Normalize features for distance calculation
      const s1 = normalize(record.sepalLength, norm.min.sepalLength, norm.max.sepalLength);
      const s2 = normalize(trainItem.sepalLength, norm.min.sepalLength, norm.max.sepalLength);

      const sw1 = normalize(record.sepalWidth, norm.min.sepalWidth, norm.max.sepalWidth);
      const sw2 = normalize(trainItem.sepalWidth, norm.min.sepalWidth, norm.max.sepalWidth);

      const p1 = normalize(record.petalLength, norm.min.petalLength, norm.max.petalLength);
      const p2 = normalize(trainItem.petalLength, norm.min.petalLength, norm.max.petalLength);

      const pw1 = normalize(record.petalWidth, norm.min.petalWidth, norm.max.petalWidth);
      const pw2 = normalize(trainItem.petalWidth, norm.min.petalWidth, norm.max.petalWidth);

      let dist = 0;
      if (params.distanceMetric === 'euclidean') {
        dist = Math.sqrt(
          Math.pow(s1 - s2, 2) +
          Math.pow(sw1 - sw2, 2) +
          Math.pow(p1 - p2, 2) +
          Math.pow(pw1 - pw2, 2)
        );
      } else {
        // Manhattan
        dist = Math.abs(s1 - s2) + Math.abs(sw1 - sw2) + Math.abs(p1 - p2) + Math.abs(pw1 - pw2);
      }

      return { dist, species: trainItem.species };
    });

    // Sort by distance ascending
    distances.sort((a, b) => a.dist - b.dist);

    // Get top K
    const kNeighbors = distances.slice(0, Math.min(params.k, distances.length));

    // Vote
    const votes: Record<Species, number> = {
      'Iris-setosa': 0,
      'Iris-versicolor': 0,
      'Iris-virginica': 0,
    };

    kNeighbors.forEach((n) => {
      votes[n.species]++;
    });

    // Find winner
    let winner: Species = 'Iris-setosa';
    let maxVotes = -1;
    let minFirstDist = Infinity;

    (Object.keys(votes) as Species[]).forEach((sp) => {
      if (votes[sp] > maxVotes) {
        maxVotes = votes[sp];
        winner = sp;
      } else if (votes[sp] === maxVotes) {
        // Break ties with closest neighbor of that class
        const firstOfClass = kNeighbors.find((n) => n.species === sp);
        const currentWinnerFirst = kNeighbors.find((n) => n.species === winner);
        const distOfSp = firstOfClass ? firstOfClass.dist : Infinity;
        const distOfWinner = currentWinnerFirst ? currentWinnerFirst.dist : Infinity;
        if (distOfSp < distOfWinner) {
          winner = sp;
        }
      }
    });

    return winner;
  };

  const evaluation = evaluateClassifier(testData, predict);

  return {
    ...evaluation,
    predict,
  };
}

// 2. DECISION TREE
interface DTNode {
  isLeaf: boolean;
  feature?: 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth';
  threshold?: number;
  prediction?: Species;
  left?: DTNode;
  right?: DTNode;
  impurity?: number;
  samples?: number;
}

export function trainDecisionTree(
  trainData: IrisRecord[],
  testData: IrisRecord[],
  params: DecisionTreeParams
): TrainingResult & { rootNode: DTNode } {
  // Gini Impurity calculator
  const calculateGini = (data: IrisRecord[]): number => {
    if (data.length === 0) return 0;
    const counts: Record<Species, number> = { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 };
    data.forEach((r) => counts[r.species]++);
    
    let sumSquares = 0;
    const n = data.length;
    (Object.keys(counts) as Species[]).forEach((sp) => {
      const p = counts[sp] / n;
      sumSquares += p * p;
    });

    return 1 - sumSquares;
  };

  const getMajorityClass = (data: IrisRecord[]): Species => {
    const counts: Record<Species, number> = { 'Iris-setosa': 0, 'Iris-versicolor': 0, 'Iris-virginica': 0 };
    data.forEach((r) => counts[r.species]++);
    let maxCount = -1;
    let majority: Species = 'Iris-setosa';
    (Object.keys(counts) as Species[]).forEach((sp) => {
      if (counts[sp] > maxCount) {
        maxCount = counts[sp];
        majority = sp;
      }
    });
    return majority;
  };

  const features: ('sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth')[] = [
    'sepalLength',
    'sepalWidth',
    'petalLength',
    'petalWidth',
  ];

  const buildTree = (data: IrisRecord[], depth: number): DTNode => {
    const samples = data.length;
    const impurity = calculateGini(data);
    const majority = getMajorityClass(data);

    // Stop conditions
    if (
      depth >= params.maxDepth ||
      samples < params.minSamplesSplit ||
      impurity === 0
    ) {
      return {
        isLeaf: true,
        prediction: majority,
        impurity,
        samples,
      };
    }

    let bestFeature: typeof features[number] | undefined = undefined;
    let bestThreshold = 0;
    let bestGiniGain = -1;
    let bestLeft: IrisRecord[] = [];
    let bestRight: IrisRecord[] = [];

    features.forEach((feature) => {
      // Find possible thresholds by sorting feature values
      const values = data.map((r) => r[feature]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

      // Midpoints as split candidates
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const left = data.filter((r) => r[feature] <= threshold);
        const right = data.filter((r) => r[feature] > threshold);

        if (left.length === 0 || right.length === 0) continue;

        const leftGini = calculateGini(left);
        const rightGini = calculateGini(right);
        const splitGini = (left.length / samples) * leftGini + (right.length / samples) * rightGini;
        const gain = impurity - splitGini;

        if (gain > bestGiniGain) {
          bestGiniGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
          bestLeft = left;
          bestRight = right;
        }
      }
    });

    if (bestGiniGain > 0 && bestFeature) {
      return {
        isLeaf: false,
        feature: bestFeature,
        threshold: bestThreshold,
        impurity,
        samples,
        left: buildTree(bestLeft, depth + 1),
        right: buildTree(bestRight, depth + 1),
      };
    }

    return {
      isLeaf: true,
      prediction: majority,
      impurity,
      samples,
    };
  };

  const rootNode = buildTree(trainData, 0);

  const predictSingle = (node: DTNode, record: Omit<IrisRecord, 'species' | 'id'>): Species => {
    if (node.isLeaf) {
      return node.prediction || 'Iris-setosa';
    }
    const val = record[node.feature!];
    if (val <= node.threshold!) {
      return predictSingle(node.left!, record);
    } else {
      return predictSingle(node.right!, record);
    }
  };

  const predict = (record: Omit<IrisRecord, 'species' | 'id'>): Species => {
    return predictSingle(rootNode, record);
  };

  const evaluation = evaluateClassifier(testData, predict);

  return {
    ...evaluation,
    predict,
    rootNode,
  };
}

// 3. MULTI-CLASS SINGLE LAYER PERCEPTRON (Softmax Neural Network)
export function trainPerceptron(
  trainData: IrisRecord[],
  testData: IrisRecord[],
  params: PerceptronParams
): TrainingResult {
  const norm = getNormalizer(trainData);
  const classes: Species[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  // Dimensions: 3 outputs (classes), 4 inputs (features)
  // Initialize weights to small random values and biases to zero
  const W: number[][] = [
    [Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05], // Setosa weights
    [Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05], // Versicolor weights
    [Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05], // Virginica weights
  ];
  const b: number[] = [0, 0, 0];

  const getNormalizedInputs = (r: Omit<IrisRecord, 'species' | 'id'>): number[] => {
    return [
      normalize(r.sepalLength, norm.min.sepalLength, norm.max.sepalLength),
      normalize(r.sepalWidth, norm.min.sepalWidth, norm.max.sepalWidth),
      normalize(r.petalLength, norm.min.petalLength, norm.max.petalLength),
      normalize(r.petalWidth, norm.min.petalWidth, norm.max.petalWidth),
    ];
  };

  const forward = (inputs: number[]): number[] => {
    const scores = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      scores[i] = b[i];
      for (let j = 0; j < 4; j++) {
        scores[i] += W[i][j] * inputs[j];
      }
    }

    // Softmax stability: subtract max score
    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const sumExps = exps.reduce((sum, val) => sum + val, 0);
    return exps.map((e) => e / (sumExps || 1));
  };

  const trainingLogs: { epoch: number; loss: number; accuracy: number }[] = [];

  // Gradient Descent
  for (let epoch = 1; epoch <= params.epochs; epoch++) {
    let totalLoss = 0;
    let correctCount = 0;

    trainData.forEach((record) => {
      const inputs = getNormalizedInputs(record);
      const probs = forward(inputs);

      const targetIdx = classes.indexOf(record.species);
      
      // Calculate loss: cross entropy
      const sampleLoss = -Math.log(Math.max(probs[targetIdx], 1e-15));
      totalLoss += sampleLoss;

      // Check correctness
      const predIdx = probs.indexOf(Math.max(...probs));
      if (predIdx === targetIdx) {
        correctCount++;
      }

      // Backpropagation: gradient dL/dz = probs - target
      const dz = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        const targetVal = i === targetIdx ? 1 : 0;
        dz[i] = probs[i] - targetVal;
      }

      // Update weights and biases
      for (let i = 0; i < 3; i++) {
        b[i] -= params.learningRate * dz[i];
        for (let j = 0; j < 4; j++) {
          W[i][j] -= params.learningRate * dz[i] * inputs[j];
        }
      }
    });

    const averageLoss = totalLoss / trainData.length;
    const epochAccuracy = correctCount / trainData.length;

    trainingLogs.push({
      epoch,
      loss: averageLoss,
      accuracy: epochAccuracy,
    });
  }

  // Final predict function using trained weights
  const predict = (record: Omit<IrisRecord, 'species' | 'id'>): Species => {
    const inputs = getNormalizedInputs(record);
    const probs = forward(inputs);
    const maxIdx = probs.indexOf(Math.max(...probs));
    return classes[maxIdx];
  };

  const evaluation = evaluateClassifier(testData, predict);

  return {
    ...evaluation,
    predict,
    trainingLogs,
  };
}
