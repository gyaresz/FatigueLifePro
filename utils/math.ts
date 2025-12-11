import { DataPoint, SnCurveParams } from '../types';

// Lanczos approximation for Gamma function
function gamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Calculate nth spectral moment using Trapezoidal rule
export function calculateMoment(data: DataPoint[], n: number): number {
  let sum = 0;
  // Sort by frequency just in case
  const sorted = [...data].sort((a, b) => a.frequency - b.frequency);

  for (let i = 0; i < sorted.length - 1; i++) {
    const f1 = sorted[i].frequency;
    const g1 = sorted[i].psd;
    const f2 = sorted[i + 1].frequency;
    const g2 = sorted[i + 1].psd;

    // Area of trapezoid for f^n * G(f)
    const y1 = Math.pow(f1, n) * g1;
    const y2 = Math.pow(f2, n) * g2;
    
    sum += 0.5 * (y1 + y2) * (f2 - f1);
  }
  return sum;
}

/**
 * Calculates S-N curve parameters (m, K) from material properties 
 * based on two points on the Wöhler curve.
 * Point 1: 1000 cycles @ 0.9 * Sut (Shigley approximation for steels)
 * Point 2: 1e6 cycles @ Se (Endurance limit)
 */
export function calculateBasquinParams(ultimateStrength: number, enduranceLimit?: number): { m: number, K: number } {
    // 1. Point (High Cycle Fatigue start)
    const N1 = 1000;
    const S1 = 0.9 * ultimateStrength;

    // 2. Point (Endurance Limit)
    const N2 = 1e6; // 1 million cycles
    // If Se is not provided, estimate as 0.5 * Sut (Conservative for steel Sut < 1400 MPa)
    const S2 = enduranceLimit && enduranceLimit > 0 ? enduranceLimit : 0.5 * ultimateStrength;

    return calculateBasquinFromPoints(N1, S1, N2, S2);
}

/**
 * Calculates S-N parameters directly from two known points on the S-N curve.
 * Useful when the user has explicit data from Ansys/Literature.
 */
export function calculateBasquinFromPoints(N1: number, S1: number, N2: number, S2: number): { m: number, K: number } {
    if (S1 <= S2) {
        throw new Error("Invalid S-N data: Stress at N1 must be higher than Stress at N2.");
    }
    if (N1 >= N2) {
        throw new Error("Invalid S-N data: N2 must be greater than N1.");
    }

    // Solve N * S^m = K for two points:
    // (S1/S2)^m = N2/N1
    // m * log(S1/S2) = log(N2/N1)
    
    const m = Math.log10(N2 / N1) / Math.log10(S1 / S2);
    const K = N1 * Math.pow(S1, m);

    return { m, K };
}

/**
 * Performs a Log-Log Least Squares Regression on multiple S-N points
 * to find the best fit 'm' and 'K' for the Basquin equation N * S^m = K.
 * 
 * Linear form: log(N) = log(K) - m * log(S)
 * Y = C + B * X
 * Where Y = log(N), X = log(S), C = log(K), B = -m
 */
export function calculateBasquinRegression(points: { cycles: number, stress: number }[]): { m: number, K: number } {
  if (points.length < 2) {
    throw new Error("At least 2 points are required for regression.");
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  const n = points.length;

  for (const p of points) {
    // Avoid log(0)
    if (p.stress <= 0 || p.cycles <= 0) continue;

    const x = Math.log10(p.stress); // X axis for regression: log(S)
    const y = Math.log10(p.cycles); // Y axis for regression: log(N)

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  // Calculate slope (B) and intercept (C) for: Y = C + B * X
  // Slope B = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) throw new Error("Cannot fit line: Vertical data alignment.");

  const B = (n * sumXY - sumX * sumY) / denominator;
  const C = (sumY - B * sumX) / n;

  // Convert back to Basquin parameters
  // Y = log(N), X = log(S)
  // log(N) = C + B * log(S)
  // log(N) = log(K) - m * log(S)
  // Therefore: B = -m  =>  m = -B
  // Therefore: C = log(K) => K = 10^C

  const m = -B;
  const K = Math.pow(10, C);

  return { m, K };
}

/**
 * Generates plot data for S-N curve visualization.
 * N * S^m = K  =>  S = (K/N)^(1/m)
 */
export function generateSnCurveData(m: number, K: number, points: number = 50) {
    const data = [];
    const minCycles = 100;    // 10^2
    const maxCycles = 1e8;    // 10^8
    
    // Logarithmic distribution of points
    const minLog = Math.log10(minCycles);
    const maxLog = Math.log10(maxCycles);
    const step = (maxLog - minLog) / (points - 1);

    for (let i = 0; i < points; i++) {
        const logN = minLog + i * step;
        const N = Math.pow(10, logN);
        
        // S = (K / N)^(1/m)
        const S = Math.pow(K / N, 1 / m);
        
        data.push({
            cycles: N,
            stress: S
        });
    }
    return data;
}

export function calculateFatigue(
  data: DataPoint[],
  sn: SnCurveParams,
  durationSeconds: number
) {
  // 1. Calculate Moments
  const m0 = calculateMoment(data, 0);
  const m1 = calculateMoment(data, 1);
  const m2 = calculateMoment(data, 2);
  const m3 = calculateMoment(data, 3);
  const m4 = calculateMoment(data, 4);

  // Avoid division by zero if data is empty or invalid
  if (m0 <= 0 || m2 <= 0 || m4 <= 0) {
    throw new Error("Invalid spectral data: Moments are zero or negative.");
  }

  // 2. RMS Stress
  const rmsStress = Math.sqrt(m0);

  // 3. Zero Crossings (nu_0) and Peaks (E[P])
  const expectedZeroCrossings = (1 / (2 * Math.PI)) * Math.sqrt(m2 / m0);
  const expectedPeaks = (1 / (2 * Math.PI)) * Math.sqrt(m4 / m2);

  // 4. Spectral Width (epsilon) and Irregularity Factor (gamma/alpha2)
  const irregularityFactor = expectedZeroCrossings / expectedPeaks; // also sqrt(m2^2 / (m0*m4))
  // epsilon = sqrt(1 - gamma^2)
  const spectralWidth = Math.sqrt(1 - Math.pow(irregularityFactor, 2));

  // 5. Narrow Band Damage (D_NB)
  // D_NB = (nu_0 * T / K) * sqrt(2)^m * Gamma(1 + m/2) * sigma_rms^m
  const gammaVal = gamma(1 + sn.m / 2);
  const nbTerm1 = (expectedZeroCrossings * durationSeconds) / sn.K;
  const nbTerm2 = Math.pow(Math.sqrt(2), sn.m);
  const nbTerm3 = Math.pow(rmsStress, sn.m);
  
  const narrowBandDamage = nbTerm1 * nbTerm2 * gammaVal * nbTerm3;

  // 6. Wirsching Correction
  // a(m) = 0.926 - 0.033m
  // b(m) = 1.587m - 2.323
  // lambda = a + (1-a)(1-epsilon)^b
  const a = 0.926 - 0.033 * sn.m;
  const b = 1.587 * sn.m - 2.323;
  
  // Correction factor lambda
  const lambda = a + (1 - a) * Math.pow(1 - spectralWidth, b);
  
  const wirschingDamage = narrowBandDamage * lambda;

  return {
    m0, m1, m2, m3, m4,
    rmsStress,
    expectedZeroCrossings,
    expectedPeaks,
    irregularityFactor,
    spectralWidth,
    narrowBandDamage,
    wirschingDamage,
    narrowBandLifeSeconds: 1 / (narrowBandDamage / durationSeconds),
    wirschingLifeSeconds: 1 / (wirschingDamage / durationSeconds)
  };
}