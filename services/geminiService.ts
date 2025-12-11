import { GoogleGenAI } from "@google/genai";
import { CalculationResults, SnCurveParams } from '../types';

export const generateEngineeringReport = async (
  results: CalculationResults,
  snParams: SnCurveParams,
  duration: number
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a Senior Mechanical Engineer specializing in Fatigue Analysis and Random Vibration.
    
    Analyze the following spectral fatigue calculation results derived from ANSYS PSD data:

    **Input Parameters:**
    - S-N Curve Slope (m): ${snParams.m}
    - S-N Curve Constant (K): ${snParams.K.toExponential(2)}
    - Exposure Duration: ${(duration / 3600).toFixed(2)} hours

    **Calculated Results:**
    - RMS Stress: ${results.rmsStress.toFixed(2)} units
    - Expected Zero Crossings (Hz): ${results.expectedZeroCrossings.toFixed(2)} Hz
    - Spectral Width Parameter (epsilon): ${results.spectralWidth.toFixed(4)}
    
    **Damage Results:**
    - Narrow Band Damage: ${results.narrowBandDamage.toExponential(4)}
    - Wirsching Damage (Corrected): ${results.wirschingDamage.toExponential(4)}
    - Estimated Life (Wirsching): ${(results.wirschingLifeSeconds / 3600).toFixed(2)} hours

    Please provide a concise engineering summary (max 200 words). 
    1. Interpret the Spectral Width (is it narrow band or wide band?).
    2. Comment on the severity of the damage (is the part likely to fail?).
    3. Explain the difference between the Narrow Band and Wirsching results in this context.
    4. Provide a recommendation.
    
    Format the output as a clean Markdown suitable for a report.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate report using AI.");
  }
};
