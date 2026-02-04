
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

// Enhanced API key retrieval for production (Vercel/Browser)
const getApiKey = () => {
  let key = "";
  try {
    // 1. Try process.env
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      key = process.env.API_KEY;
    }
  } catch (e) {}
  
  // 2. Fallback to global window shim
  if (!key) {
    key = (window as any).process?.env?.API_KEY || "";
  }
  return key;
};

export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const finalName = record.patientName || userInfo.name;
  const finalAge = record.patientAge || userInfo.age;
  const finalGender = record.patientGender || userInfo.gender;

  const prompt = `
    রোগীর তথ্য:
    নাম: ${finalName}, বয়স: ${finalAge}, লিঙ্গ: ${finalGender}
    বর্তমান লক্ষণ: ${record.symptoms.join(", ")}, অন্যান্য: ${record.customSymptoms}
    পূর্ববর্তী রোগ: ${record.prevIllnesses.join(", ")}, অন্যান্য: ${record.customPrevIllnesses}
    ব্যব্যহৃত ঔষধ: ${record.pastMeds}
    টেস্ট রিপোর্ট: ${JSON.stringify(record.tests.map(t => ({ name: t.name, result: t.result })))}
    ভাইটালস: রক্তচাপ: ${record.bp}, ডায়াবেটিস: ${record.diabetes}

    কাজ: আপনি একজন বিশেষজ্ঞ ডাক্তার। রোগীর রোগ নির্ণয় করুন এবং একটি ডিজিটাল প্রেসক্রিপশন তৈরি করুন।
    আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে যেখানে diagnosis, advice এবং medicines (ARRAY) থাকবে।
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            advice: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  englishName: { type: Type.STRING },
                  bengaliName: { type: Type.STRING },
                  genericName: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  dosage: { type: Type.STRING }
                },
                required: ["englishName", "bengaliName", "genericName", "purpose", "dosage"]
              }
            }
          },
          required: ["diagnosis", "advice", "medicines"]
        }
      }
    });

    if (!response.text) throw new Error("AI returned empty text");

    const result = JSON.parse(response.text.trim());
    return {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: userInfo.id,
      patientName: finalName,
      patientAge: finalAge,
      patientGender: finalGender,
      date: new Date().toLocaleDateString('bn-BD'),
      ...result
    };
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw error;
  }
};

export const getMedicineInfo = async (query: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "সিস্টেম ত্রুটি: API Key পাওয়া যায়নি।";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ঔষধ "${query}" এর কাজ এবং ব্যবহার বাংলায় বিস্তারিত লিখুন।`
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error) {
    return "দুঃখিত, সার্ভারে সমস্যা হচ্ছে।";
  }
};

export const findAlternatives = async (query: string): Promise<any[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `"${query}" ঔষধের বাংলাদেশের সেরা বিকল্প ব্র্যান্ডগুলোর তালিকা JSON ফরম্যাটে দিন।`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            company: { type: Type.STRING },
                            price: { type: Type.STRING },
                            generic: { type: Type.STRING }
                        },
                        required: ["name", "company", "price", "generic"]
                    }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        return [];
    }
};
