
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

// Robust API key retrieval
const getApiKey = () => {
  // Use a safe check to avoid ReferenceError if 'process' is not defined globally
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}
  
  // Fallback to window object shim
  return (window as any).process?.env?.API_KEY || "";
};

export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please check configuration.");

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

    কাজ: আপনি একজন বিশেষজ্ঞ ডাক্তার। উপরের তথ্যের ভিত্তিতে রোগীর রোগ নির্ণয় করুন এবং একটি ডিজিটাল প্রেসক্রিপশন তৈরি করুন।
    
    নির্দেশনা:
    ১. রোগ নির্ণয় (diagnosis) বাংলায় লিখুন।
    ২. ঔষধের তালিকা (medicines) তৈরি করুন। প্রতিটির জন্য:
       - englishName: ঔষধের নাম ইংরেজিতে।
       - bengaliName: ঔষধের নাম বাংলায় (ব্র্যাকেটে ব্যবহারের জন্য)।
       - genericName: ঔষধের জেনেরিক নাম।
       - purpose: ঔষধটি কেন দেওয়া হয়েছে বা কি কাজ করবে তা বাংলায় লিখুন।
       - dosage: ব্যবহারের নিয়ম (যেমন: ১+০+১ খাওয়ার পর) বাংলায় লিখুন।
    ৩. সাধারণ পরামর্শ (advice) বাংলায় বিস্তারিত লিখুন।
    
    আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে।
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

    if (!response.text) {
      throw new Error("এআই সার্ভার থেকে কোনো তথ্য পাওয়া যায়নি।");
    }

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
      contents: `ঔষধের নাম: "${query}"। এই ঔষধটি কি কাজ করে এবং কেন ব্যবহার করা হয়? বিস্তারিত বাংলায় সুন্দর করে লিখুন যাতে সাধারণ মানুষ বুঝতে পারে।`
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error) {
    console.error("Medicine Info Error:", error);
    return "দুঃখিত, তথ্য আনতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।";
  }
};

export const findAlternatives = async (query: string): Promise<any[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `ঔষধের নাম বা জেনেরিক নাম: "${query}"। বাংলাদেশে পাওয়া যায় এমন প্রধান বিকল্প ঔষধগুলোর একটি তালিকা দিন। প্রতিটির ব্র্যান্ড নাম, জেনেরিক নাম, কোম্পানির নাম এবং আনুমানিক দাম বাংলায় দিন।`,
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
        
        if (!response.text) return [];
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Alternatives Error:", error);
        return [];
    }
};
