
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, Prescription } from "../types";

/**
 * জেসন আউটপুট ক্লিন করার ফাংশন
 */
const cleanJSON = (str: string): string => {
  try {
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return str.substring(start, end + 1);
    }
    const arrStart = str.indexOf('[');
    const arrEnd = str.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) {
      return str.substring(arrStart, arrEnd + 1);
    }
    return str;
  } catch (e) {
    return str;
  }
};

/**
 * রোগের লক্ষণ বিশ্লেষণ করে ডিজিটাল প্রেসক্রিপশন তৈরি করে
 */
export const generateDiagnosis = async (record: MedicalRecord, userInfo: any): Promise<Prescription> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const finalName = record.patientName || userInfo.name;
  const finalAge = record.patientAge || userInfo.age;
  const finalGender = record.patientGender || userInfo.gender;

  const prompt = `
    রোগীর প্রোফাইল:
    নাম: ${finalName}, বয়স: ${finalAge}, লিঙ্গ: ${finalGender}
    লক্ষণসমূহ: ${record.symptoms.join(", ")}, ${record.customSymptoms}
    পূর্ববর্তী অসুস্থতা: ${record.prevIllnesses.join(", ")}, ${record.customPrevIllnesses}
    বর্তমান ঔষধ: ${record.pastMeds}
    ভাইটালস: রক্তচাপ: ${record.bp}, ডায়াবেটিস: ${record.diabetes}

    কাজ: আপনি একজন ডিজিটাল বিশেষজ্ঞ ডাক্তার। উপরের লক্ষণগুলো বিশ্লেষণ করে একটি রোগ নির্ণয় এবং একটি ডিজিটাল প্রেসক্রিপশন তৈরি করুন।
    শুধুমাত্র নিচের JSON স্কিমা অনুযায়ী উত্তর দিন। কোনো ব্যাখ্যা বা অতিরিক্ত কথা দিবেন না।
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING, description: "রোগের সম্ভাব্য নাম" },
            advice: { type: Type.STRING, description: "রোগীর জন্য ডাক্তারের উপদেশ" },
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
    console.error("Diagnosis Generation Failed:", error);
    throw new Error("এআই এর মাধ্যমে রোগ নির্ণয় করা সম্ভব হয়নি। আপনার ইন্টারনেট কানেকশন এবং এপিআই কী সেটিংস চেক করুন।");
  }
};

/**
 * ঔষধের কার্যকারিতা সম্পর্কে তথ্য দেয়
 */
export const getMedicineInfo = async (query: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `"${query}" ঔষধটির কাজ, ব্যবহারের নিয়ম এবং বিশেষ সতর্কতা বাংলায় বিস্তারিত পয়েন্ট আকারে লিখুন।` }] }]
    });
    return response.text || 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।';
  } catch (error: any) {
    console.error("Medicine Info Fetch Failed:", error);
    return "তথ্য সংগ্রহ করতে সমস্যা হয়েছে।";
  }
};

/**
 * ঔষধের বিকল্প ব্র্যান্ড খুঁজে বের করে
 */
export const findAlternatives = async (query: string): Promise<any[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        console.error("Alternatives Fetch Failed:", error);
        return [];
    }
};
