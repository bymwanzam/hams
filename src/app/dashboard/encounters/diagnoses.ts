// Suggested diagnoses for the Principal/Additional Diagnosis fields.
//
// The Ghana Health Service Resources Hub (https://ghs.gov.gh/resources-hub)
// only publishes the Standard Treatment Guidelines (STG, 7th ed., 2017) as
// a single large PDF — there's no structured, extractable disease list to
// pull from programmatically. This list is instead compiled from the
// conditions the STG's chapters actually cover, cross-checked against the
// diagnoses GHS's own Annual/Holistic Health Assessment Reports
// consistently report as the leading causes of OPD attendance and
// admission nationally (malaria first among them by a wide margin, followed
// by respiratory infections, diarrhoeal disease, hypertension, and so on).
// It is not a substitute for the STG itself — the field also accepts free
// text for anything not listed here.
export const COMMON_DIAGNOSES: string[] = [
  // Infectious & parasitic diseases
  "Malaria (Uncomplicated)",
  "Malaria (Severe/Complicated)",
  "Malaria in Pregnancy",
  "Typhoid Fever",
  "Cholera",
  "Measles",
  "Chickenpox (Varicella)",
  "Mumps",
  "Meningitis",
  "Tuberculosis (Pulmonary)",
  "Tuberculosis (Extra-Pulmonary)",
  "HIV/AIDS",
  "Hepatitis A",
  "Hepatitis B",
  "Intestinal Worms (Helminthiasis)",
  "Schistosomiasis (Bilharzia)",
  "Lymphatic Filariasis",
  "Onchocerciasis (River Blindness)",
  "Buruli Ulcer",
  "Yellow Fever",
  "COVID-19",

  // Respiratory
  "Upper Respiratory Tract Infection (URTI)",
  "Acute Bronchitis",
  "Pneumonia",
  "Asthma",
  "Chronic Obstructive Pulmonary Disease (COPD)",
  "Sinusitis",
  "Pharyngitis / Tonsillitis",
  "Otitis Media",
  "Whooping Cough (Pertussis)",

  // Gastrointestinal
  "Diarrhoea Disease (Non-Bloody)",
  "Dysentery (Bloody Diarrhoea)",
  "Gastroenteritis",
  "Peptic Ulcer Disease",
  "Gastritis",
  "Gastroesophageal Reflux Disease (GERD)",
  "Constipation",
  "Haemorrhoids",
  "Appendicitis",
  "Inguinal Hernia",
  "Irritable Bowel Syndrome",

  // Cardiovascular
  "Hypertension",
  "Heart Failure",
  "Ischaemic Heart Disease",
  "Stroke (Cerebrovascular Accident)",
  "Rheumatic Heart Disease",
  "Cardiomyopathy",

  // Endocrine, metabolic & haematology
  "Diabetes Mellitus (Type 1)",
  "Diabetes Mellitus (Type 2)",
  "Anaemia",
  "Anaemia in Pregnancy",
  "Sickle Cell Disease",
  "Severe Acute Malnutrition",
  "Moderate Malnutrition",
  "Obesity",
  "Goitre / Thyroid Disorder",
  "Gout",

  // Musculoskeletal
  "Rheumatism / Joint Pains",
  "Osteoarthritis",
  "Low Back Pain",
  "Fracture",
  "Sprain / Strain",

  // Genitourinary
  "Urinary Tract Infection",
  "Sexually Transmitted Infection — Gonorrhoea",
  "Sexually Transmitted Infection — Syphilis",
  "Benign Prostatic Hyperplasia",
  "Acute Renal Failure",
  "Chronic Kidney Disease",
  "Urinary Calculi (Kidney Stones)",

  // Skin
  "Bacterial Skin Infection",
  "Fungal Skin Infection",
  "Scabies",
  "Eczema / Dermatitis",
  "Allergic Reaction / Urticaria",
  "Burns",

  // Eye & ENT
  "Conjunctivitis",
  "Eye Infection",
  "Cataract",
  "Refractive Error",
  "Ear Infection",

  // Obstetrics & gynaecology
  "Antenatal Care — Normal Pregnancy",
  "Pregnancy-Induced Hypertension / Pre-eclampsia",
  "Miscarriage / Abortion Complications",
  "Pelvic Inflammatory Disease",
  "Menstrual Disorder",

  // Mental health
  "Depression",
  "Anxiety Disorder",
  "Psychosis",
  "Epilepsy / Seizure Disorder",
  "Substance Use Disorder",

  // Trauma & injury
  "Road Traffic Accident Injury",
  "Laceration / Wound",
  "Animal / Dog Bite",
  "Snake Bite",
  "Poisoning",

  // Dental / oral
  "Dental Caries",
  "Oral Abscess",

  // Other common presentations
  "Headache / Migraine",
  "Fever of Unknown Origin",
  "Food Poisoning",
].sort((a, b) => a.localeCompare(b));
