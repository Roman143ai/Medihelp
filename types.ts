
export interface User {
  id: string;
  name: string;
  password: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  mobile?: string;
  profilePic?: string;
  themeIndex?: number;
  prescriptions?: Prescription[];
}

export interface MedicalRecord {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  symptoms: string[];
  customSymptoms: string;
  prevIllnesses: string[];
  customPrevIllnesses: string;
  pastMeds: string;
  tests: { name: string; result: string; image?: string }[];
  bp: string;
  diabetes: string;
}

export interface Prescription {
  id: string;
  userId: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  diagnosis: string;
  medicines: MedicineItem[];
  advice: string;
  date: string;
}

export interface MedicineItem {
  englishName: string;
  bengaliName: string;
  genericName: string;
  purpose: string;
  dosage: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  medName: string;
  quantity: string;
  address: string;
  phone: string;
  status: 'Pending' | 'Replied';
  adminReply?: string;
  userConfirmation?: string;
  timestamp: number;
}

export interface MedicinePrice {
  id: string;
  name: string;
  generic: string;
  company: string;
  price: string;
}

export interface AdminSettings {
  homeHeaderBanner: string;
  homeFooterBanner: string;
  footerBannerText: string;
  prescriptionHeader: string;
  prescriptionFooter: string;
  prescriptionTheme: string;
  digitalSignature: string;
  welcomeBanner: {
    text: string;
    image: string;
  };
}
