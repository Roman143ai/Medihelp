
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

/**
 * AI Initialization Helper
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("এপিআই কী (API Key) সেট করা নেই। ভেরসেল সেটিংস থেকে API_KEY যোগ করুন।");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * জেসন আউটপুট থেকে মার্কডাউন এবং অতিরিক্ত টেক্সট সরানোর হেল্পার
 */
const cleanJSON = (str: string): string => {
  try {
    const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? match[0] : str;
  } catch (e) {
    return str;
  }
};

/**
 * রোগের লক্ষণ বিশ্লেষণ করে ডিজিটাল প্রেসক্রিপশন তৈরি করে
 */
export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  try {
    const ai = getAIClient();
    
    const finalName = record.patientName || userInfo.name;
    const finalAge = record.patientAge || userInfo.age;
    const finalGender = record.patientGender || userInfo.gender;

    const prompt = `
      একজন বিশেষজ্ঞ ডাক্তার হিসেবে নিচের তথ্যের ভিত্তিতে একটি ডিজিটাল প্রেসক্রিপশন তৈরি করুন:
      রোগীর নাম: ${finalName}, বয়স: ${finalAge}, লিঙ্গ: ${finalGender}
      লক্ষণসমূহ: ${record.symptoms.join(", ")}, ${record.customSymptoms}
      পূর্ববর্তী রোগ: ${record.prevIllnesses.join(", ")}, ${record.customPrevIllnesses}
      বর্তমান ঔষধ: ${record.pastMeds}
      ভাইটালস: বিপি: ${record.bp}, ডায়াবেটিস: ${record.diabetes}

      আউটপুট অবশ্যই শুধুমাত্র JSON ফরম্যাটে হতে হবে।
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ parts: [{ text: prompt }] }],
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

    const text = response.text;
    if (!text) throw new Error("এআই কোনো রেসপন্স প্রদান করেনি।");

    const result = JSON.parse(cleanJSON(text));

    return {
      id: "RX-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      userId: userInfo.id,
      patientName: finalName,
      patientAge: finalAge,
      patientGender: finalGender,
      date: new Date().toLocaleDateString('bn-BD'),
      ...result
    };
  } catch (error: any) {
    console.error("Diagnosis Error:", error);
    throw new Error(error.message || "এআই সার্ভিস কাজ করছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
  }
};

/**
 * ঔষধের কার্যকারিতা সম্পর্কে তথ্য দেয়
 */
export const getMedicineInfo = async (query: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `ঔষধ "${query}" এর কাজ, ব্যবহার এবং সতর্কতা বাংলায় বিস্তারিত লিখুন।` }] }]
    });
    return response.text || 'কোনো তথ্য পাওয়া যায়নি।';
  } catch (error: any) {
    console.error("Medicine Info Error:", error);
    return "তথ্য সংগ্রহ করা সম্ভব হয়নি: " + (error.message || "");
  }
};

/**
 * ঔষধের বিকল্প ব্র্যান্ড খুঁজে বের করে
 */
export const findAlternatives = async (query: string): Promise<any[]> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: `"${query}" ঔষধের বাংলাদেশের সেরা বিকল্প ব্র্যান্ডগুলোর একটি তালিকা জেসন ফরম্যাটে দিন।` }] }],
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
        const text = response.text;
        if (!text) return [];
        return JSON.parse(cleanJSON(text));
    } catch (error: any) {
        console.error("Alternatives Error:", error);
        return [];
    }
};
