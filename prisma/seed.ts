import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const facility = await prisma.facility.upsert({
    where: { code: "MAIN" },
    update: {},
    create: {
      name: "Main Hospital",
      code: "MAIN",
      isMain: true,
    },
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@hospital.local" },
    update: {},
    create: {
      email: "admin@hospital.local",
      passwordHash,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      facilityId: facility.id,
    },
  });

  // One test user per scoped role, so role-based access can be tried out
  // immediately without going through the Users & Roles module by hand.
  const roleUsers: {
    email: string;
    firstName: string;
    lastName: string;
    role:
      | "HEALTH_OFFICER"
      | "DOCTOR"
      | "OPD_NURSE"
      | "WARD_NURSE"
      | "PHARMACIST"
      | "LAB_TECH"
      | "IMAGING_OFFICER"
      | "ACCOUNTANT"
      | "INVENTORY_MANAGER";
  }[] = [
    { email: "frontdesk@hospital.local", firstName: "Front", lastName: "Desk", role: "HEALTH_OFFICER" },
    { email: "doctor@hospital.local", firstName: "Ama", lastName: "Doctor", role: "DOCTOR" },
    { email: "opdnurse@hospital.local", firstName: "Adjoa", lastName: "OpdNurse", role: "OPD_NURSE" },
    { email: "wardnurse@hospital.local", firstName: "Akosua", lastName: "WardNurse", role: "WARD_NURSE" },
    { email: "pharmacist@hospital.local", firstName: "Kwame", lastName: "Pharmacist", role: "PHARMACIST" },
    { email: "labtech@hospital.local", firstName: "Efua", lastName: "LabTech", role: "LAB_TECH" },
    { email: "imaging@hospital.local", firstName: "Kojo", lastName: "Imaging", role: "IMAGING_OFFICER" },
    { email: "accounts@hospital.local", firstName: "Abena", lastName: "Accounts", role: "ACCOUNTANT" },
    { email: "inventory@hospital.local", firstName: "Yaw", lastName: "Inventory", role: "INVENTORY_MANAGER" },
  ];

  for (const u of roleUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        facilityId: facility.id,
      },
    });
  }

  // A standard-clinic panel across the usual lab sections. Prices are GHS
  // placeholders — adjust from the Laboratory catalog once live.
  const labTests: {
    name: string;
    code: string;
    category: string;
    sampleType: string;
    price: number;
  }[] = [
    // Hematology
    { name: "Full Blood Count", code: "FBC", category: "Hematology", sampleType: "Blood", price: 45 },
    { name: "Hemoglobin (Hb) Estimation", code: "HB", category: "Hematology", sampleType: "Blood", price: 15 },
    { name: "Erythrocyte Sedimentation Rate (ESR)", code: "ESR", category: "Hematology", sampleType: "Blood", price: 20 },
    { name: "Blood Grouping & Rhesus Factor", code: "BG-RH", category: "Hematology", sampleType: "Blood", price: 25 },
    { name: "Sickling Test", code: "SICKLE", category: "Hematology", sampleType: "Blood", price: 20 },
    { name: "Reticulocyte Count", code: "RETIC", category: "Hematology", sampleType: "Blood", price: 25 },
    { name: "Bleeding & Clotting Time", code: "BCT", category: "Hematology", sampleType: "Blood", price: 15 },
    // Parasitology
    { name: "Malaria Parasite Test (BFMPS)", code: "MP", category: "Parasitology", sampleType: "Blood", price: 20 },
    { name: "Filariasis Test", code: "FIL", category: "Parasitology", sampleType: "Blood", price: 30 },
    // Clinical Chemistry
    { name: "Random Blood Sugar", code: "RBS", category: "Clinical Chemistry", sampleType: "Blood", price: 15 },
    { name: "Fasting Blood Sugar", code: "FBS", category: "Clinical Chemistry", sampleType: "Blood", price: 15 },
    { name: "Oral Glucose Tolerance Test", code: "OGTT", category: "Clinical Chemistry", sampleType: "Blood", price: 60 },
    { name: "Liver Function Test", code: "LFT", category: "Clinical Chemistry", sampleType: "Blood", price: 80 },
    { name: "Renal Function Test", code: "RFT", category: "Clinical Chemistry", sampleType: "Blood", price: 80 },
    { name: "Lipid Profile", code: "LIPID", category: "Clinical Chemistry", sampleType: "Blood", price: 70 },
    { name: "Uric Acid", code: "URIC", category: "Clinical Chemistry", sampleType: "Blood", price: 25 },
    { name: "Total Protein & Albumin", code: "TPALB", category: "Clinical Chemistry", sampleType: "Blood", price: 30 },
    { name: "Serum Amylase", code: "AMYL", category: "Clinical Chemistry", sampleType: "Blood", price: 40 },
    // Serology & Immunology
    { name: "HIV Screening (I & II)", code: "HIV", category: "Serology & Immunology", sampleType: "Blood", price: 30 },
    { name: "Hepatitis B Surface Antigen", code: "HBSAG", category: "Serology & Immunology", sampleType: "Blood", price: 35 },
    { name: "Hepatitis C Antibody", code: "HCV", category: "Serology & Immunology", sampleType: "Blood", price: 35 },
    { name: "Syphilis Screening (VDRL/RPR)", code: "VDRL", category: "Serology & Immunology", sampleType: "Blood", price: 25 },
    { name: "Widal Test (Typhoid)", code: "WIDAL", category: "Serology & Immunology", sampleType: "Blood", price: 25 },
    { name: "H. Pylori Test", code: "HPYLORI", category: "Serology & Immunology", sampleType: "Blood", price: 35 },
    { name: "Rheumatoid Factor", code: "RF", category: "Serology & Immunology", sampleType: "Blood", price: 30 },
    { name: "C-Reactive Protein (CRP)", code: "CRP", category: "Serology & Immunology", sampleType: "Blood", price: 35 },
    // Endocrinology
    { name: "Thyroid Function Test (TSH/T3/T4)", code: "TFT", category: "Endocrinology", sampleType: "Blood", price: 90 },
    // Urinalysis
    { name: "Urinalysis (Routine/Microscopy)", code: "UA", category: "Urinalysis", sampleType: "Urine", price: 20 },
    { name: "Urine Pregnancy Test", code: "UPT", category: "Urinalysis", sampleType: "Urine", price: 15 },
    // Microbiology
    { name: "Urine Culture & Sensitivity", code: "UCS", category: "Microbiology", sampleType: "Urine", price: 50 },
    { name: "Stool Routine Examination (O/C/S)", code: "STOOL", category: "Microbiology", sampleType: "Stool", price: 20 },
    { name: "Stool Culture", code: "SCULT", category: "Microbiology", sampleType: "Stool", price: 45 },
    { name: "Sputum for AFB (TB Screening)", code: "AFB", category: "Microbiology", sampleType: "Sputum", price: 30 },
    { name: "Wound Swab Culture & Sensitivity", code: "WOUND", category: "Microbiology", sampleType: "Swab", price: 50 },
    { name: "High Vaginal Swab (HVS)", code: "HVS", category: "Microbiology", sampleType: "Swab", price: 45 },
  ];

  for (const t of labTests) {
    await prisma.labTest.upsert({
      where: { code: t.code },
      update: {
        category: t.category,
        sampleType: t.sampleType,
        price: t.price,
      },
      create: t,
    });
  }

  const drugs: {
    name: string;
    genericName: string;
    form: string;
    unit: string;
    unitPrice: number;
    quantityOnHand: number;
    reorderLevel: number;
  }[] = [
    { name: "Paracetamol 500mg", genericName: "Paracetamol", form: "Tablet", unit: "tablet", unitPrice: 0.5, quantityOnHand: 500, reorderLevel: 50 },
    { name: "Amoxicillin 500mg", genericName: "Amoxicillin", form: "Capsule", unit: "capsule", unitPrice: 1.2, quantityOnHand: 300, reorderLevel: 30 },
    { name: "Artemether/Lumefantrine 20/120mg", genericName: "Artemether/Lumefantrine", form: "Tablet", unit: "tablet", unitPrice: 15, quantityOnHand: 150, reorderLevel: 20 },
    { name: "Oral Rehydration Salts", genericName: "ORS", form: "Sachet", unit: "sachet", unitPrice: 3, quantityOnHand: 200, reorderLevel: 20 },
    { name: "Zinc Sulphate 20mg", genericName: "Zinc Sulphate", form: "Tablet", unit: "tablet", unitPrice: 0.8, quantityOnHand: 200, reorderLevel: 20 },
    { name: "Ibuprofen 400mg", genericName: "Ibuprofen", form: "Tablet", unit: "tablet", unitPrice: 0.6, quantityOnHand: 300, reorderLevel: 30 },
    { name: "Metronidazole 400mg", genericName: "Metronidazole", form: "Tablet", unit: "tablet", unitPrice: 0.7, quantityOnHand: 250, reorderLevel: 25 },
    { name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", form: "Tablet", unit: "tablet", unitPrice: 1.5, quantityOnHand: 150, reorderLevel: 15 },
    { name: "Omeprazole 20mg", genericName: "Omeprazole", form: "Capsule", unit: "capsule", unitPrice: 1.0, quantityOnHand: 200, reorderLevel: 20 },
    { name: "Diclofenac 50mg", genericName: "Diclofenac", form: "Tablet", unit: "tablet", unitPrice: 0.6, quantityOnHand: 200, reorderLevel: 20 },
    { name: "Cetirizine 10mg", genericName: "Cetirizine", form: "Tablet", unit: "tablet", unitPrice: 0.5, quantityOnHand: 150, reorderLevel: 15 },
    { name: "Folic Acid 5mg", genericName: "Folic Acid", form: "Tablet", unit: "tablet", unitPrice: 0.3, quantityOnHand: 300, reorderLevel: 30 },
    { name: "Ferrous Sulphate 200mg", genericName: "Ferrous Sulphate", form: "Tablet", unit: "tablet", unitPrice: 0.3, quantityOnHand: 300, reorderLevel: 30 },
    { name: "Amlodipine 5mg", genericName: "Amlodipine", form: "Tablet", unit: "tablet", unitPrice: 1.0, quantityOnHand: 150, reorderLevel: 15 },
    { name: "Metformin 500mg", genericName: "Metformin", form: "Tablet", unit: "tablet", unitPrice: 0.8, quantityOnHand: 200, reorderLevel: 20 },
  ];

  for (const d of drugs) {
    await prisma.drug.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  const insuranceProviders: { name: string; type: string }[] = [
    { name: "National Health Insurance Scheme (NHIS)", type: "NHIS" },
    { name: "Acacia Health Insurance", type: "Private" },
    { name: "Nationwide Medical Insurance", type: "Private" },
    { name: "Glico Healthcare", type: "Private" },
    { name: "Metropolitan Health Insurance", type: "Private" },
  ];

  for (const p of insuranceProviders) {
    await prisma.insuranceProvider.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  const inventoryItems: {
    name: string;
    category: string;
    unit: string;
    quantityOnHand: number;
    reorderLevel: number;
  }[] = [
    { name: "Surgical Gloves (Box of 100)", category: "Consumables", unit: "box", quantityOnHand: 40, reorderLevel: 10 },
    { name: "Disposable Syringes 5ml", category: "Consumables", unit: "piece", quantityOnHand: 500, reorderLevel: 100 },
    { name: "Cotton Wool", category: "Consumables", unit: "roll", quantityOnHand: 60, reorderLevel: 15 },
    { name: "Gauze Bandage", category: "Consumables", unit: "pack", quantityOnHand: 80, reorderLevel: 20 },
    { name: "IV Cannula (18G)", category: "Consumables", unit: "piece", quantityOnHand: 150, reorderLevel: 30 },
    { name: "IV Giving Set", category: "Consumables", unit: "piece", quantityOnHand: 100, reorderLevel: 20 },
    { name: "Face Masks (Surgical)", category: "Consumables", unit: "box", quantityOnHand: 50, reorderLevel: 10 },
    { name: "Hand Sanitizer 500ml", category: "Consumables", unit: "bottle", quantityOnHand: 30, reorderLevel: 8 },
    { name: "Digital Thermometer", category: "Equipment", unit: "piece", quantityOnHand: 15, reorderLevel: 5 },
    { name: "Blood Pressure Monitor", category: "Equipment", unit: "piece", quantityOnHand: 8, reorderLevel: 2 },
    { name: "Pulse Oximeter", category: "Equipment", unit: "piece", quantityOnHand: 10, reorderLevel: 3 },
    { name: "Disinfectant Solution 5L", category: "Consumables", unit: "gallon", quantityOnHand: 20, reorderLevel: 5 },
    { name: "Hospital Bed Sheets", category: "Linen", unit: "piece", quantityOnHand: 100, reorderLevel: 25 },
    { name: "Examination Table Paper Roll", category: "Consumables", unit: "roll", quantityOnHand: 25, reorderLevel: 5 },
    { name: "Cannula Fixation Tape", category: "Consumables", unit: "roll", quantityOnHand: 40, reorderLevel: 10 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item, facilityId: facility.id },
    });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@hospital.local / ChangeMe123!  (change this immediately)");
  console.log(
    "Role test accounts (same password): frontdesk@, doctor@, opdnurse@, wardnurse@, pharmacist@, labtech@, imaging@, accounts@hospital.local"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
