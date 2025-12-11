export interface DataPoint {
  frequency: number;
  psd: number;
}

export interface SnCurveParams {
  m: number; // Slope
  K: number; // Constant (N * S^m = K)
}

export interface AnalysisParams {
  exposureTime: number; // in seconds
  exposureTimeUnit: 'seconds' | 'minutes' | 'hours';
}

export interface CalculationResults {
  m0: number;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  rmsStress: number;
  expectedZeroCrossings: number; // nu_0
  expectedPeaks: number; // E[P]
  irregularityFactor: number; // gamma
  spectralWidth: number; // epsilon
  narrowBandDamage: number;
  wirschingDamage: number;
  narrowBandLifeSeconds: number;
  wirschingLifeSeconds: number;
}