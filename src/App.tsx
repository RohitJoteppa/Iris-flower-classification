import { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  TrendingUp,
  RefreshCw,
  Info,
  Layers,
  GitBranch,
  Activity,
  Dna,
  Target,
} from 'lucide-react';
import { irisDataset } from './data';
import {
  Species,
  FeatureKey,
  FEATURE_LABELS,
  SPECIES_COLORS,
  SPECIES_BG_COLORS,
  SPECIES_LABELS,
  KNNParams,
  DecisionTreeParams,
  PerceptronParams,
  TrainingResult,
} from './types';
import { trainKNN, trainDecisionTree, trainPerceptron } from './ml';
import ScatterPlot from './components/ScatterPlot';
import MetricsDisplay from './components/MetricsDisplay';
import IrisIllustration from './components/IrisIllustration';

// Deterministic stratified partition of Iris flowers
function getStratifiedSplit(splitRatio: number, seed: number) {
  const setosa = irisDataset.filter((d) => d.species === 'Iris-setosa');
  const versicolor = irisDataset.filter((d) => d.species === 'Iris-versicolor');
  const virginica = irisDataset.filter((d) => d.species === 'Iris-virginica');

  // Deterministic shuffle using sine wave score
  const shuffle = (arr: typeof irisDataset) => {
    return [...arr].sort((a, b) => {
      const scoreA = Math.sin(a.id * 7.5 + seed * 2.3);
      const scoreB = Math.sin(b.id * 7.5 + seed * 2.3);
      return scoreA - scoreB;
    });
  };

  const shufSetosa = shuffle(setosa);
  const shufVersicolor = shuffle(versicolor);
  const shufVirginica = shuffle(virginica);

  const trainCount = Math.floor(50 * splitRatio);

  const trainSet = [
    ...shufSetosa.slice(0, trainCount),
    ...shufVersicolor.slice(0, trainCount),
    ...shufVirginica.slice(0, trainCount),
  ];

  const testSet = [
    ...shufSetosa.slice(trainCount),
    ...shufVersicolor.slice(trainCount),
    ...shufVirginica.slice(trainCount),
  ];

  return { trainSet, testSet };
}

export default function App() {
  // 1. Classifier Configuration State
  const [classifierType, setClassifierType] = useState<'knn' | 'decision-tree' | 'perceptron'>('knn');
  const [splitRatio, setSplitRatio] = useState<number>(0.75);
  const [seed, setSeed] = useState<number>(42);

  const [knnParams, setKnnParams] = useState<KNNParams>({ k: 5, distanceMetric: 'euclidean' });
  const [dtParams, setDtParams] = useState<DecisionTreeParams>({ maxDepth: 4, minSamplesSplit: 4 });
  const [perceptronParams, setPerceptronParams] = useState<PerceptronParams>({ learningRate: 0.1, epochs: 150 });

  // 2. Training Data & Results State
  const [trainSet, setTrainSet] = useState<typeof irisDataset>([]);
  const [testSet, setTestSet] = useState<typeof irisDataset>([]);
  const [trainedModel, setTrainedModel] = useState<TrainingResult | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(true);

  // 3. User Custom Interactive Test Point
  const [customValues, setCustomValues] = useState({
    sepalLength: 5.8,
    sepalWidth: 3.0,
    petalLength: 4.35,
    petalWidth: 1.3,
  });

  // 4. Visualization Selection
  const [xAxis, setXAxis] = useState<FeatureKey>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureKey>('petalWidth');

  // Trigger Training on Hyperparameter / Data split changes
  useEffect(() => {
    let isMounted = true;
    setIsTraining(true);

    const timer = setTimeout(() => {
      const { trainSet: train, testSet: test } = getStratifiedSplit(splitRatio, seed);

      let result: TrainingResult;
      if (classifierType === 'knn') {
        result = trainKNN(train, test, knnParams);
      } else if (classifierType === 'decision-tree') {
        result = trainDecisionTree(train, test, dtParams);
      } else {
        result = trainPerceptron(train, test, perceptronParams);
      }

      if (isMounted) {
        setTrainSet(train);
        setTestSet(test);
        setTrainedModel(result);
        setIsTraining(false);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [classifierType, knnParams, dtParams, perceptronParams, splitRatio, seed]);

  // Derive training IDs as a set for faster search
  const trainIds = useMemo(() => new Set(trainSet.map((d) => d.id)), [trainSet]);

  // Live output of current interactive classification
  const livePrediction = useMemo(() => {
    if (!trainedModel) return null;
    return trainedModel.predict(customValues);
  }, [trainedModel, customValues]);

  // Interactive point click callback
  const handlePlotClick = (xVal: number, yVal: number) => {
    setCustomValues((prev) => ({
      ...prev,
      [xAxis]: parseFloat(xVal.toFixed(2)),
      [yAxis]: parseFloat(yVal.toFixed(2)),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-50 to-blue-50/15 text-slate-900 flex flex-col font-sans antialiased" id="iris-app-root">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-4.5 px-6 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg border border-blue-500/10">
                <Dna className="w-4.5 h-4.5" />
              </span>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Iris Flower Classification
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Interactive Machine Learning exploration sandbox. Train classifiers on the classic Iris dataset.
            </p>
          </div>

          {/* Core Model Status Summary */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white border border-slate-200/60 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Model:</span>
              <span className="font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                {classifierType === 'knn'
                  ? `k-NN (k=${knnParams.k})`
                  : classifierType === 'decision-tree'
                  ? `Decision Tree`
                  : 'Perceptron Network'}
              </span>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>Test Accuracy:</span>
              <span className="font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/10 rounded px-1.5 py-0.5">
                {trainedModel ? `${(trainedModel.accuracy * 100).toFixed(1)}%` : 'Training...'}
              </span>
            </div>

            <button
              onClick={() => setSeed((s) => s + 1)}
              className="bg-slate-900 hover:bg-slate-850 active:scale-[0.98] text-white rounded-xl px-3.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition-all duration-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              Reshuffle Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Bento Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT BLOCK: Visual Scatter Plot & Model configuration (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Scatter Plot Visualizer */}
          <div className="flex-grow">
            <ScatterPlot
              data={irisDataset}
              xAxis={xAxis}
              yAxis={yAxis}
              onXAxisChange={setXAxis}
              onYAxisChange={setYAxis}
              predictFn={trainedModel?.predict}
              currentTestValues={customValues}
              onPlotClick={handlePlotClick}
              trainIds={trainIds}
            />
          </div>

          {/* Model Configuration & Hyperparameters Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-400" />
              Classifier Controls & Hyperparameters
            </h3>

            {/* Model Type Selector Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <button
                onClick={() => setClassifierType('knn')}
                className={`p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer hover:shadow-xs hover:-translate-y-0.5 ${
                  classifierType === 'knn'
                    ? 'border-blue-500 bg-gradient-to-b from-blue-50/40 to-blue-50/10 text-blue-950 ring-1 ring-blue-500/20 shadow-[0_3px_8px_rgba(59,130,246,0.03)]'
                    : 'border-slate-200/60 hover:border-slate-300 text-slate-600 bg-slate-50/30 hover:bg-white'
                }`}
              >
                <Layers className={`w-4 h-4 mb-1.5 transition-colors duration-300 ${classifierType === 'knn' ? 'text-blue-500' : 'text-slate-400'}`} />
                <div className="font-bold text-xs tracking-tight">k-Nearest Neighbors</div>
                <div className="text-[9px] text-slate-400 leading-normal mt-0.5">Instance-based distance solver</div>
              </button>

              <button
                onClick={() => setClassifierType('decision-tree')}
                className={`p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer hover:shadow-xs hover:-translate-y-0.5 ${
                  classifierType === 'decision-tree'
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/40 to-emerald-50/10 text-emerald-950 ring-1 ring-emerald-500/20 shadow-[0_3px_8px_rgba(16,185,129,0.03)]'
                    : 'border-slate-200/60 hover:border-slate-300 text-slate-600 bg-slate-50/30 hover:bg-white'
                }`}
              >
                <GitBranch className={`w-4 h-4 mb-1.5 transition-colors duration-300 ${classifierType === 'decision-tree' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <div className="font-bold text-xs tracking-tight">Decision Tree</div>
                <div className="text-[9px] text-slate-400 leading-normal mt-0.5">Recursive Gini impurity splitter</div>
              </button>

              <button
                onClick={() => setClassifierType('perceptron')}
                className={`p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer hover:shadow-xs hover:-translate-y-0.5 ${
                  classifierType === 'perceptron'
                    ? 'border-pink-500 bg-gradient-to-b from-pink-50/40 to-pink-50/10 text-pink-950 ring-1 ring-pink-500/20 shadow-[0_3px_8px_rgba(236,72,153,0.03)]'
                    : 'border-slate-200/60 hover:border-slate-300 text-slate-600 bg-slate-50/30 hover:bg-white'
                }`}
              >
                <TrendingUp className={`w-4 h-4 mb-1.5 transition-colors duration-300 ${classifierType === 'perceptron' ? 'text-pink-500' : 'text-slate-400'}`} />
                <div className="font-bold text-xs tracking-tight">Neural Perceptron</div>
                <div className="text-[9px] text-slate-400 leading-normal mt-0.5">Gradient-descent softmax network</div>
              </button>
            </div>

            {/* Hyperparameter adjustments based on selection */}
            <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
              {classifierType === 'knn' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">K Neighbors</label>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 rounded-md text-[10px] font-bold border border-blue-500/10">{knnParams.k}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="2"
                      value={knnParams.k}
                      onChange={(e) =>
                        setKnnParams((prev) => ({ ...prev, k: parseInt(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>1 (Overfit)</span>
                      <span>15 (Smoother)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Distance Metric
                    </label>
                    <select
                      value={knnParams.distanceMetric}
                      onChange={(e) =>
                        setKnnParams((prev) => ({
                          ...prev,
                          distanceMetric: e.target.value as 'euclidean' | 'manhattan',
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all cursor-pointer"
                    >
                      <option value="euclidean">Euclidean Distance (Straight Line)</option>
                      <option value="manhattan">Manhattan Distance (Grid Taxi-cab)</option>
                    </select>
                  </div>
                </div>
              )}

              {classifierType === 'decision-tree' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Max Tree Depth</label>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-500/10">{dtParams.maxDepth}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={dtParams.maxDepth}
                      onChange={(e) =>
                        setDtParams((prev) => ({ ...prev, maxDepth: parseInt(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>1 (Stump)</span>
                      <span>8 (Deep Complex)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Min Samples split</label>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-500/10">{dtParams.minSamplesSplit}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={dtParams.minSamplesSplit}
                      onChange={(e) =>
                        setDtParams((prev) => ({ ...prev, minSamplesSplit: parseInt(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>2 (Max Splitting)</span>
                      <span>15 (Regularized)</span>
                    </div>
                  </div>
                </div>
              )}

              {classifierType === 'perceptron' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Learning Rate</label>
                      <span className="px-2 py-0.5 bg-pink-500/10 text-pink-700 rounded-md text-[10px] font-bold border border-pink-500/10">{perceptronParams.learningRate}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.5"
                      step="0.01"
                      value={perceptronParams.learningRate}
                      onChange={(e) =>
                        setPerceptronParams((prev) => ({ ...prev, learningRate: parseFloat(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>0.01 (Slow)</span>
                      <span>0.5 (Aggressive)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Training Epochs</label>
                      <span className="px-2 py-0.5 bg-pink-500/10 text-pink-700 rounded-md text-[10px] font-bold border border-pink-500/10">{perceptronParams.epochs}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      step="10"
                      value={perceptronParams.epochs}
                      onChange={(e) =>
                        setPerceptronParams((prev) => ({ ...prev, epochs: parseInt(e.target.value) }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>10 (Underfit)</span>
                      <span>400 (Converged)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Split Ratio Slider */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="w-full sm:w-1/2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Train/Test Split</label>
                  <span className="text-[11px] font-semibold">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-extrabold">{Math.round(splitRatio * 100)}%</span>
                    <span className="mx-1 text-slate-300">/</span>
                    <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded font-medium">{Math.round((1 - splitRatio) * 100)}%</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.05"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-850"
                />
              </div>

              <div className="text-[10px] text-slate-400 text-left sm:text-right max-w-sm leading-relaxed">
                💡 Stratified split guarantees balanced quantities of all 3 species in training ({trainSet.length} samples) and testing ({testSet.length} samples).
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BLOCK: Live Interactive Playground & Model Performance Reports (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Active Classifier Playground (Live Sliders) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between" id="classifier-playground">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-400" />
                Flower Prediction Playground
              </h3>
              <p className="text-[11px] text-slate-400 mb-5 leading-normal">
                Adjust measurements to run real-time classification through your trained model.
              </p>
            </div>

            {/* 4 Feature Sliders */}
            <div className="space-y-4 mb-6">
              {/* Sepal Length */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-600">{FEATURE_LABELS.sepalLength}</span>
                  <span className="font-mono font-bold bg-slate-50 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 shadow-xs">
                    {customValues.sepalLength} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="4.3"
                  max="7.9"
                  step="0.1"
                  value={customValues.sepalLength}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, sepalLength: parseFloat(e.target.value) }))
                  }
                  className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
                    classifierType === 'knn' ? 'accent-blue-500' : classifierType === 'decision-tree' ? 'accent-emerald-500' : 'accent-pink-500'
                  }`}
                />
              </div>

              {/* Sepal Width */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-600">{FEATURE_LABELS.sepalWidth}</span>
                  <span className="font-mono font-bold bg-slate-50 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 shadow-xs">
                    {customValues.sepalWidth} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.4"
                  step="0.1"
                  value={customValues.sepalWidth}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, sepalWidth: parseFloat(e.target.value) }))
                  }
                  className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
                    classifierType === 'knn' ? 'accent-blue-500' : classifierType === 'decision-tree' ? 'accent-emerald-500' : 'accent-pink-500'
                  }`}
                />
              </div>

              {/* Petal Length */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-600">{FEATURE_LABELS.petalLength}</span>
                  <span className="font-mono font-bold bg-slate-50 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 shadow-xs">
                    {customValues.petalLength} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.9"
                  step="0.1"
                  value={customValues.petalLength}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, petalLength: parseFloat(e.target.value) }))
                  }
                  className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
                    classifierType === 'knn' ? 'accent-blue-500' : classifierType === 'decision-tree' ? 'accent-emerald-500' : 'accent-pink-500'
                  }`}
                />
              </div>

              {/* Petal Width */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-600">{FEATURE_LABELS.petalWidth}</span>
                  <span className="font-mono font-bold bg-slate-50 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 shadow-xs">
                    {customValues.petalWidth} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={customValues.petalWidth}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, petalWidth: parseFloat(e.target.value) }))
                  }
                  className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
                    classifierType === 'knn' ? 'accent-blue-500' : classifierType === 'decision-tree' ? 'accent-emerald-500' : 'accent-pink-500'
                  }`}
                />
              </div>
            </div>

            {/* LIVE PREDICTION CARD */}
            {livePrediction ? (
              <div
                className={`rounded-2xl border p-4.5 flex items-center justify-between gap-4 transition-all duration-500 ${
                  livePrediction === 'Iris-setosa'
                    ? 'border-blue-500/25 bg-blue-50/20 shadow-[0_4px_24px_rgba(59,130,246,0.03)]'
                    : livePrediction === 'Iris-versicolor'
                    ? 'border-emerald-500/25 bg-emerald-50/20 shadow-[0_4px_24px_rgba(16,185,129,0.03)]'
                    : 'border-pink-500/25 bg-pink-50/20 shadow-[0_4px_24px_rgba(236,72,153,0.03)]'
                }`}
              >
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                    Predicted Classification
                  </span>
                  <h4
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: SPECIES_COLORS[livePrediction] }}
                  >
                    Iris {SPECIES_LABELS[livePrediction]}
                  </h4>

                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-[210px]">
                    {livePrediction === 'Iris-setosa'
                      ? 'Characterized by exceptionally short and narrow petals. Perfectly segregated.'
                      : livePrediction === 'Iris-versicolor'
                      ? 'Medium sized petals. Sits intermediate between setosa and robust virginica.'
                      : 'Distinguished by massive, wide and elongated petals. Highly robust species.'}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-1.5 shrink-0">
                  <IrisIllustration species={livePrediction} className="w-18 h-18" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center text-xs text-slate-400">
                ⌛ Training model...
              </div>
            )}
          </div>

          {/* Model Evaluation Metrics Section */}
          {trainedModel ? (
            <MetricsDisplay
              accuracy={trainedModel.accuracy}
              confusionMatrix={trainedModel.confusionMatrix}
              precision={trainedModel.precision}
              recall={trainedModel.recall}
              f1Score={trainedModel.f1Score}
              testSetSize={testSet.length}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm flex items-center justify-center text-center">
              <RefreshCw className="w-5 h-5 text-slate-300 animate-spin mr-2" />
              <span className="text-xs text-slate-400 font-medium">Loading model evaluations...</span>
            </div>
          )}

        </div>

        {/* BOTTOM FULL WIDTH SECTION: Dataset Details & Explanation */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] mt-2 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-2 flex justify-center md:justify-start">
            <span className="p-3.5 bg-slate-50 border border-slate-200/50 text-slate-400 rounded-2xl shadow-xs">
              <Info className="w-6 h-6 text-slate-500" />
            </span>
          </div>
          
          <div className="md:col-span-10 text-slate-600">
            <h4 className="text-sm font-bold text-slate-800 mb-1.5">
              About the Iris Dataset & Decision Spaces
            </h4>
            <p className="text-xs leading-relaxed text-slate-500">
              The Iris dataset (introduced by Ronald Fisher in 1936) consists of 50 samples from each of three species of Iris flowers: **Iris setosa**, **Iris versicolor**, and **Iris virginica**. Four features were measured from each sample: the length and the width of the sepals and petals, in centimeters. 
            </p>
            <p className="text-xs leading-relaxed text-slate-500 mt-2">
              By shifting the X and Y axes of the interactive scatter plot, you can explore the separating capacity of different measurements. The background gradient maps the model's high-dimensional classification boundaries down to the chosen 2D view, dynamically reflecting how flower sizes are mathematically classified.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
