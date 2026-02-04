
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

// Helper to initialize AI with current key
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY found to be empty. Please check environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * রোগের লক্ষণ বিশ্লেষণ করে ডিজিটাল প্রেসক্রিপশন তৈরি করে
 */
export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  const ai = getAI();
  
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
            diagnosis: { type: Type.STRING, description: "রোগের নাম বা রোগ নির্ণয়" },
            advice: { type: Type.STRING, description: "রোগীর জন্য উপদেশ" },
            medicines: {
              type: Type.ARRAY,
              description: "ঔষধের তালিকা",
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
    if (!text) throw new Error("AI returned empty content");

    const result = JSON.parse(text);
    return {
      id: "RX" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      userId: userInfo.id,
      patientName: finalName,
      patientAge: finalAge,
      patientGender: finalGender,
      date: new Date().toLocaleDateString('bn-BD'),
      ...result
    };
  } catch (error: any) {
    console.error("Diagnosis Error:", error);
    throw new Error("এআই সার্ভারের সাথে সংযোগ করা যাচ্ছে না। দয়া করে আপনার ইন্টারনেট এবং সেটিংস চেক করুন। " + (error.message || ""));
  }
};

/**
 * ঔষধের কার্যকারিতা সম্পর্কে তথ্য দেয়
 */
export const getMedicineInfo = async (query: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ঔষধ "${query}" এর কাজ, ব্যবহার এবং সতর্কতা বাংলায় বিস্তারিত লিখুন যাতে সাধারণ মানুষ সহজে বুঝতে পারে। বিষয়গুলো পয়েন্ট আকারে লিখুন।`
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error: any) {
    console.error("Medicine Info Error:", error);
    return "দুঃখিত, তথ্য সংগ্রহে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  }
};

/**
 * ঔষধের বিকল্প ব্র্যান্ড খুঁজে বের করে
 */
export const findAlternatives = async (query: string): Promise<any[]> => {
    try {
        const ai = getAI();
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
                            name: { type: Type.STRING, description: "Brand Name" },
                            company: { type: Type.STRING, description: "Manufacturer" },
                            price: { type: Type.STRING, description: "Approx Price" },
                            generic: { type: Type.STRING, description: "Generic Name" }
                        },
                        required: ["name", "company", "price", "generic"]
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error: any) {
        console.error("Alternatives Search Error:", error);
        return [];
    }
};
