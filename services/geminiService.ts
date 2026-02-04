
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

/**
 * জেসন আউটপুট থেকে মার্কডাউন এবং অতিরিক্ত টেক্সট সরানোর হেল্পার
 */
const cleanJSON = (str: string): string => {
  try {
    // যদি আউটপুট ```json ... ``` এর ভেতর থাকে
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
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
    শুধুমাত্র JSON ফরম্যাটে উত্তর দিন। অতিরিক্ত কোনো টেক্সট বা বর্ণনা দিবেন না।
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

    const text = response.text;
    if (!text) throw new Error("এআই সার্ভার থেকে কোনো উত্তর আসেনি।");

    const cleanedText = cleanJSON(text);
    const result = JSON.parse(cleanedText);

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
    throw new Error(error.message || "রোগ নির্ণয় করতে সমস্যা হয়েছে। এপিআই কী বা নেটওয়ার্ক চেক করুন।");
  }
};

/**
 * ঔষধের কার্যকারিতা সম্পর্কে তথ্য দেয়
 */
export const getMedicineInfo = async (query: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ঔষধ "${query}" এর কাজ, ব্যবহার এবং সতর্কতা বাংলায় বিস্তারিত পয়েন্ট আকারে লিখুন যাতে সাধারণ মানুষ সহজে বুঝতে পারে।`
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error: any) {
    console.error("Medicine Info Error:", error);
    return "দুঃখিত, তথ্য সংগ্রহে সমস্যা হয়েছে: " + (error.message || "");
  }
};

/**
 * ঔষধের বিকল্প ব্র্যান্ড খুঁজে বের করে
 */
export const findAlternatives = async (query: string): Promise<any[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `"${query}" ঔষধের বাংলাদেশের সেরা বিকল্প ব্র্যান্ডগুলোর একটি তালিকা জেসন ফরম্যাটে দিন।`,
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
        console.error("Alternatives Search Error:", error);
        return [];
    }
};
