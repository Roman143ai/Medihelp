
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

/**
 * রোগের লক্ষণ বিশ্লেষণ করে ডিজিটাল প্রেসক্রিপশন তৈরি করে
 */
export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("এপিআই কী পাওয়া যায়নি। অনুগ্রহ করে সেটিংস চেক করুন।");
  }

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
    ভাইটালস: রক্তচাপ: ${record.bp}, ডায়াবেটিস: ${record.diabetes}

    কাজ: আপনি একজন বিশেষজ্ঞ ডাক্তার। উপরের তথ্যের ভিত্তিতে রোগীর রোগ নির্ণয় করুন এবং একটি ডিজিটাল প্রেসক্রিপশন তৈরি করুন।
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
                required: ["englishName", "bengaliName", "genericName", "purpose", "dosage"],
                propertyOrdering: ["englishName", "bengaliName", "genericName", "purpose", "dosage"]
              }
            }
          },
          required: ["diagnosis", "advice", "medicines"],
          propertyOrdering: ["diagnosis", "advice", "medicines"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("এআই কোনো উত্তর প্রদান করেনি।");

    const result = JSON.parse(text);
    return {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: userInfo.id,
      patientName: finalName,
      patientAge: finalAge,
      patientGender: finalGender,
      date: new Date().toLocaleDateString('bn-BD'),
      ...result
    };
  } catch (error: any) {
    console.error("AI Diagnosis Error:", error);
    throw new Error("সার্ভার থেকে রেসপন্স পেতে সমস্যা হচ্ছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন। " + (error.message || ""));
  }
};

/**
 * ঔষধের কার্যকারিতা সম্পর্কে তথ্য দেয়
 */
export const getMedicineInfo = async (query: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "এপিআই কী পাওয়া যায়নি।";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ঔষধ "${query}" এর কাজ, ব্যবহার এবং সতর্কতা বাংলায় বিস্তারিত লিখুন যাতে সাধারণ মানুষ সহজে বুঝতে পারে।`
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error: any) {
    console.error("Medicine Info Error:", error);
    return "দুঃখিত, তথ্য সংগ্রহে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন। " + (error.message || "");
  }
};

/**
 * ঔষধের বিকল্প ব্র্যান্ড খুঁজে বের করে
 */
export const findAlternatives = async (query: string): Promise<any[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `"${query}" ঔষধের বাংলাদেশের সেরা বিকল্প ব্র্যান্ডগুলোর একটি তালিকা দিন।`,
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
                        required: ["name", "company", "price", "generic"],
                        propertyOrdering: ["name", "company", "price", "generic"]
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error: any) {
        console.error("Alternatives Error:", error);
        return [];
    }
};
