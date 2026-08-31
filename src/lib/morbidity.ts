// GHS OPD Monthly Morbidity return — the disease "data element" taxonomy and
// a best-effort classifier from the free-text diagnosis fields
// (Encounter.principalDiagnosis / additionalDiagnosis) onto those elements.
//
// The consultation form records diagnoses as free text with a <datalist> of
// suggestions (src/app/dashboard/encounters/diagnoses.ts) — there is no
// structured disease coding. So this report is populated heuristically, the
// same way the OPD Attendance report infers new/old from EncounterType and
// the Inpatient report infers malaria from a boolean flag. Rows that either
// find no keyword match, or describe a distinction the system doesn't
// capture (the malaria test-workflow sub-rows, occupational vs home injury,
// "Brought in Dead", "Referrals"), simply stay 0.
//
// Everything here is deliberately in one file so that if structured
// diagnosis coding is added to Encounter later, only `classifyDiagnosis`
// needs to change.

export interface MorbidityElement {
  /** Stable id, referenced by the report's count maps. */
  key: string;
  /** Exact GHS wording, shown as the row label. */
  label: string;
  /**
   * Lowercase substrings that route a diagnosis to this element. Omit to
   * make the row present on the form but never auto-populated.
   */
  keywords?: string[];
}

export interface MorbiditySection {
  title: string;
  elements: MorbidityElement[];
}

// The catch-all row (last section) that any unmatched, non-excluded
// diagnosis is counted against.
export const CATCH_ALL_KEY = "all_other_diseases";

export const MORBIDITY_TAXONOMY: MorbiditySection[] = [
  {
    title: "Communicable Immunizable",
    elements: [
      { key: "afp_polio", label: "AFP (Polio)", keywords: ["polio", "poliomyelitis", "acute flaccid paralysis", "afp"] },
      { key: "meningitis", label: "Meningitis", keywords: ["meningitis", "meningococcal"] },
      { key: "neonatal_tetanus", label: "Neo-Natal Tetanus", keywords: ["neonatal tetanus", "neo-natal tetanus", "tetanus neonatorum"] },
      { key: "pertussis", label: "Pertussis (Whooping Cough)", keywords: ["pertussis", "whooping cough"] },
      { key: "diphtheria", label: "Diphtheria", keywords: ["diphtheria"] },
      { key: "measles", label: "Measles", keywords: ["measles", "rubeola"] },
      { key: "yellow_fever", label: "Yellow Fever (YF)", keywords: ["yellow fever"] },
      { key: "tetanus", label: "Tetanus", keywords: ["tetanus"] },
      { key: "tuberculosis", label: "Tuberculosis", keywords: ["tuberculosis", "pulmonary tb", "tb "] },
    ],
  },
  {
    title: "Communicable non-immunizable",
    elements: [
      // The malaria sub-rows below are handled explicitly in
      // classifyDiagnosis(), not by keywords — free text can't tell
      // "suspected" from "tested positive". Generic uncomplicated malaria
      // lands on "not tested but treated as malaria"; malaria in pregnancy
      // on its pregnancy equivalent; severe/complicated on
      // "Severe Malaria (Non-Lab-Confirmed)".
      { key: "uncomplicated_malaria_suspected", label: "Uncomplicated Malaria suspected" },
      { key: "uncomplicated_malaria_suspected_tested", label: "Uncomplicated Malaria Suspected Tested" },
      { key: "uncomplicated_malaria_tested_positive", label: "Uncomplicated Malaria Tested Positive" },
      { key: "uncomplicated_malaria_treated", label: "Uncomplicated Malaria not tested but treated as malaria" },
      { key: "uncomplicated_malaria_neg_treated", label: "Uncomplicated Malaria Cases Tested Negative but Treated as Malaria" },
      { key: "malaria_pregnancy_suspected", label: "Uncomplicated Malaria in Pregnancy suspected" },
      { key: "malaria_pregnancy_suspected_tested", label: "Uncomplicated Malaria in Pregnancy Suspected Tested" },
      { key: "malaria_pregnancy_tested_positive", label: "Uncomplicated Malaria in Pregnancy tested positive" },
      { key: "malaria_pregnancy_treated", label: "Uncomplicated Malaria in Pregnancy not tested but treated as malaria" },
      { key: "malaria_pregnancy_neg_treated", label: "Uncomplicated Malaria in Pregnancy Tested Negative but Treated as Malaria" },
      { key: "severe_malaria_lab", label: "Severe Malaria (Lab-Confirmed)" },
      { key: "severe_malaria_non_lab", label: "Severe Malaria (Non-Lab-Confirmed)" },
      { key: "typhoid_fever", label: "Typhoid Fever", keywords: ["typhoid", "enteric fever"] },
      { key: "suspected_cholera", label: "Suspected Cholera", keywords: ["cholera"] },
      { key: "diarrhoea_diseases", label: "Diarrhoea Diseases", keywords: ["diarrhoea", "diarrhea", "dysentery", "gastroenteritis", "food poisoning"] },
      { key: "viral_hepatitis", label: "Viral Hepatitis", keywords: ["viral hepatitis", "hepatitis a", "hepatitis b", "hepatitis c", "hepatitis e", "hepatitis"] },
      { key: "schistosomiasis", label: "Schistosomiasis (Bilharzia)", keywords: ["schistosomiasis", "bilharzia"] },
      { key: "guinea_worm", label: "Suspected Guinea Worm", keywords: ["guinea worm", "dracunculiasis"] },
      { key: "onchocerciasis", label: "Onchocerciasis", keywords: ["onchocerciasis", "river blindness"] },
      { key: "buruli_ulcer", label: "Buruli Ulcer", keywords: ["buruli ulcer", "buruli"] },
      { key: "leprosy", label: "Leprosy", keywords: ["leprosy", "hansen disease", "hansen's disease"] },
      { key: "hiv_aids", label: "HIV/AIDS Related conditions", keywords: ["hiv", "aids", "retroviral disease", "rvd"] },
      { key: "mumps", label: "Mumps", keywords: ["mumps"] },
      { key: "intestinal_worms", label: "Intestinal Worms", keywords: ["intestinal worm", "helminth", "hookworm", "ascaris", "roundworm", "tapeworm", "worm infestation"] },
      { key: "chicken_pox", label: "Chicken Pox", keywords: ["chicken pox", "chickenpox", "varicella"] },
      { key: "upper_respiratory_infections", label: "Upper Respiratory Tract Infections", keywords: ["upper respiratory", "urti", "common cold", "nasopharyngitis", "sinusitis", "pharyngitis", "tonsillitis", "rhinitis"] },
      { key: "pneumonia", label: "Pneumonia", keywords: ["pneumonia", "bronchopneumonia", "lower respiratory tract infection", "lrti"] },
      { key: "septicaemia", label: "Septicaemia", keywords: ["septicaemia", "septicemia", "sepsis", "bacteraemia", "bacteremia"] },
    ],
  },
  {
    title: "Non-Communicable Diseases",
    elements: [
      { key: "malnutrition", label: "Malnutrition", keywords: ["malnutrition", "kwashiorkor", "marasmus", "undernutrition", "failure to thrive"] },
      { key: "obesity", label: "Obesity", keywords: ["obesity", "obese", "overweight"] },
      { key: "anaemia", label: "Anaemia", keywords: ["anaemia", "anemia"] },
      { key: "other_nutritional", label: "Other Nutritional Diseases", keywords: ["vitamin deficiency", "vitamin a deficiency", "rickets", "scurvy", "pellagra", "goitre", "goiter", "iodine deficiency"] },
      { key: "hypertension", label: "Hypertension", keywords: ["hypertension", "htn", "high blood pressure", "raised blood pressure"] },
      { key: "cardiac_diseases", label: "Cardiac Diseases", keywords: ["cardiac", "heart failure", "heart disease", "ischaemic heart", "ischemic heart", "rheumatic heart", "cardiomyopathy", "atrial fibrillation", "angina"] },
      { key: "stroke", label: "Stroke", keywords: ["stroke", "cerebrovascular accident", "cva ", "cerebrovascular"] },
      { key: "diabetes_mellitus", label: "Diabetes Mellitus", keywords: ["diabetes", "diabetic ketoacidosis", "dka"] },
      { key: "rheumatism_arthritis", label: "Rheumatism / Other Joint Pains / Arthritis", keywords: ["rheumatism", "arthritis", "osteoarthritis", "joint pain", "joint pains", "gout", "low back pain", "back pain"] },
      { key: "sickle_cell", label: "Sickle Cell Disease", keywords: ["sickle cell", "sickle-cell", "scd"] },
      { key: "asthma", label: "Asthma", keywords: ["asthma"] },
      { key: "copd", label: "Chronic Obstructive Pulmonary Disease (COPD)", keywords: ["copd", "chronic obstructive", "emphysema", "chronic bronchitis"] },
      { key: "breast_cancer", label: "Breast Cancer", keywords: ["breast cancer", "carcinoma of breast", "carcinoma of the breast"] },
      { key: "cervical_cancer", label: "Cervical Cancer", keywords: ["cervical cancer", "carcinoma of cervix", "carcinoma of the cervix"] },
      { key: "lymphoma", label: "Lymphoma", keywords: ["lymphoma", "hodgkin", "non-hodgkin"] },
      { key: "prostate_cancer", label: "Prostate Cancer", keywords: ["prostate cancer", "carcinoma of prostate", "carcinoma of the prostate"] },
      { key: "hepatocellular_carcinoma", label: "Hepatocellular Carcinoma", keywords: ["hepatocellular carcinoma", "hepatocellular", "liver cancer", "hcc"] },
      { key: "other_cancers", label: "All Other Cancers", keywords: ["cancer", "carcinoma", "malignancy", "malignant", "tumour", "tumor", "neoplasm", "sarcoma", "leukaemia", "leukemia"] },
    ],
  },
  {
    title: "Mental Health Conditions",
    elements: [
      { key: "schizophrenia", label: "Schizophrenia", keywords: ["schizophrenia", "schizophrenic", "schizoaffective"] },
      { key: "acute_psychotic_disorder", label: "Acute Psychotic Disorder", keywords: ["acute psychotic", "brief psychotic", "psychosis", "psychotic disorder"] },
      { key: "mono_symptoms_delusion", label: "Mono Symptoms Delusion", keywords: ["delusional disorder", "monosymptomatic", "mono symptom delusion"] },
      { key: "depression", label: "Depression", keywords: ["depression", "depressive disorder", "major depressive"] },
      { key: "substance_abuse", label: "Substance Abuse", keywords: ["substance abuse", "substance use disorder", "drug abuse", "alcoholism", "alcohol use disorder", "cannabis use", "opioid use"] },
      { key: "epilepsy", label: "Epilepsy", keywords: ["epilepsy", "seizure disorder", "convulsive disorder"] },
      { key: "autism", label: "Autism", keywords: ["autism", "autistic", "autism spectrum"] },
      { key: "mental_retardation", label: "Mental Retardation", keywords: ["mental retardation", "intellectual disability", "learning disability", "global developmental delay"] },
      { key: "adhd", label: "Attention Deficit Hyperactivity Disorder", keywords: ["adhd", "attention deficit", "hyperactivity disorder"] },
      { key: "conversion_disorders", label: "Conversion Disorders", keywords: ["conversion disorder", "conversion reaction", "dissociative disorder"] },
      { key: "ptss", label: "Post Traumatic Stress Syndrome", keywords: ["ptsd", "post traumatic stress", "post-traumatic stress"] },
      { key: "generalized_anxiety", label: "Generalized Anxiety", keywords: ["generalized anxiety", "generalised anxiety", "gad"] },
      { key: "other_anxiety_disorders", label: "Other Anxiety Disorders", keywords: ["anxiety", "panic disorder", "panic attack", "phobia", "obsessive compulsive", "ocd"] },
      { key: "neurosis", label: "Neurosis", keywords: ["neurosis", "neurotic disorder"] },
    ],
  },
  {
    title: "Specialized Conditions",
    elements: [
      { key: "acute_eye_infection", label: "Acute Eye Infection", keywords: ["conjunctivitis", "eye infection", "red eye", "keratitis", "stye", "hordeolum", "ophthalmia"] },
      { key: "cataract", label: "Cataract", keywords: ["cataract"] },
      { key: "trachoma", label: "Trachoma", keywords: ["trachoma"] },
      { key: "otitis_media", label: "Otitis Media", keywords: ["otitis media"] },
      { key: "other_acute_ear_infection", label: "Other Acute Ear infection", keywords: ["otitis externa", "ear infection", "mastoiditis"] },
      { key: "dental_caries", label: "Dental Caries", keywords: ["dental caries", "tooth decay", "caries"] },
      { key: "dental_swellings", label: "Dental Swellings", keywords: ["dental swelling", "dental abscess", "tooth abscess", "oral abscess", "gum swelling", "gum boil"] },
      { key: "oral_maxillofacial_trauma", label: "Traumatic Conditions (Oral and Maxillofacial Region)", keywords: ["maxillofacial", "jaw fracture", "mandibular fracture", "dental trauma", "avulsed tooth"] },
      { key: "periodontal_diseases", label: "Periodontal diseases", keywords: ["periodontal", "periodontitis", "gingivitis"] },
      { key: "cerebral_palsy", label: "Cerebral Palsy", keywords: ["cerebral palsy"] },
      { key: "liver_diseases", label: "liver diseases", keywords: ["liver disease", "hepatic failure", "cirrhosis", "chronic liver disease", "hepatomegaly", "fatty liver"] },
      { key: "acute_uti", label: "Acute Urinary Tract infection", keywords: ["urinary tract infection", "uti", "cystitis", "pyelonephritis"] },
      { key: "skin_diseases", label: "Skin Diseases", keywords: ["skin infection", "skin disease", "cellulitis", "impetigo", "tinea", "ringworm", "scabies", "eczema", "dermatitis", "urticaria", "boil", "abscess", "fungal skin", "bacterial skin"] },
      { key: "ulcer", label: "Ulcer", keywords: ["ulcer", "peptic ulcer", "leg ulcer", "pressure sore", "bed sore"] },
      { key: "kidney_related_diseases", label: "Kidney Related Diseases", keywords: ["kidney disease", "renal failure", "acute kidney injury", "chronic kidney disease", "ckd", "nephritis", "nephrotic syndrome", "kidney stone", "renal calculi", "urinary calculi", "nephrolithiasis", "renal"] },
      { key: "other_oral_conditions", label: "Other Oral Conditions", keywords: ["oral thrush", "oral candidiasis", "stomatitis", "mouth ulcer", "aphthous ulcer", "glossitis"] },
    ],
  },
  {
    title: "Obstetrics & Gynaecological Conditions",
    elements: [
      { key: "gynaecological_conditions", label: "Gynaecological conditions", keywords: ["gynaecological", "gynecological", "pelvic inflammatory", "pid", "menstrual", "dysmenorrhoea", "dysmenorrhea", "menorrhagia", "amenorrhoea", "amenorrhea", "menopause"] },
      { key: "pregnancy_related_complications", label: "Pregnancy Related Complications", keywords: ["pregnancy related complication", "pregnancy-induced hypertension", "pre-eclampsia", "preeclampsia", "eclampsia", "antepartum haemorrhage", "hyperemesis gravidarum", "threatened abortion", "miscarriage", "abortion", "ectopic pregnancy", "pih"] },
      { key: "anaemia_in_pregnancy", label: "Anaemia in Pregnancy", keywords: ["anaemia in pregnancy", "anemia in pregnancy"] },
    ],
  },
  {
    title: "Reproductive Tract Diseases",
    elements: [
      { key: "gonorrhoea", label: "Gonorrhoea", keywords: ["gonorrhoea", "gonorrhea", "gonococcal"] },
      { key: "genital_ulcer", label: "Genital Ulcer", keywords: ["genital ulcer", "chancroid", "syphilis", "genital herpes"] },
      { key: "vaginal_discharge", label: "Vaginal Discharge", keywords: ["vaginal discharge", "vaginitis", "vaginal candidiasis", "bacterial vaginosis", "trichomoniasis"] },
      { key: "urethral_discharge", label: "Urethral Discharge", keywords: ["urethral discharge", "urethritis"] },
      { key: "other_male_reproductive", label: "Other diseases of the Male reproductive system", keywords: ["erectile dysfunction", "epididymitis", "orchitis", "hydrocele", "varicocele", "prostatitis", "prostatic hyperplasia", "benign prostatic", "bph", "phimosis"] },
      { key: "other_female_reproductive", label: "Other diseases of the Female reproductive system", keywords: ["ovarian cyst", "uterine fibroid", "fibroid", "endometriosis", "cervicitis", "uterine prolapse", "bartholin"] },
    ],
  },
  {
    title: "Injuries and Others",
    elements: [
      { key: "transport_injuries", label: "Transport injuries (Road Traffic Accidents)", keywords: ["road traffic accident", "road traffic", "rta", "motor accident", "traffic accident", "motorbike accident", "motor vehicle accident", "pedestrian knockdown"] },
      { key: "home_injuries", label: "Home Injuries (Home Accidents and Injuries)", keywords: ["home injury", "home accident", "domestic accident", "fall at home"] },
      { key: "occupational_injuries", label: "Occupational / Industrial Injuries", keywords: ["occupational injury", "industrial injury", "workplace injury", "work-related injury"] },
      { key: "burns", label: "Burns", keywords: ["burn", "burns", "scald"] },
      { key: "poisoning", label: "Poisoning (Occupational Poisoning)", keywords: ["poisoning", "intoxication", "overdose", "organophosphate", "chemical exposure"] },
      { key: "dog_bite", label: "Dog bite", keywords: ["dog bite"] },
      { key: "human_bites", label: "Human bites", keywords: ["human bite"] },
      { key: "snake_bite", label: "Snake Bite", keywords: ["snake bite", "snakebite", "snake envenomation"] },
      { key: "sexual_abuse", label: "Sexual Abuse", keywords: ["sexual abuse", "sexual assault", "rape", "defilement"] },
      { key: "domestic_violence", label: "Domestic Violence", keywords: ["domestic violence", "intimate partner violence", "spousal abuse"] },
      { key: "pyrexia_unknown_origin", label: "Pyrexia of unknown origin (not Malaria)", keywords: ["pyrexia of unknown origin", "fever of unknown origin", "puo", "fever of unknown"] },
      { key: "brought_in_dead", label: "Brought in Dead", keywords: ["brought in dead", "dead on arrival"] },
      { key: "other_animal_bites", label: "Other Animal Bites", keywords: ["animal bite", "cat bite", "monkey bite", "rodent bite", "insect bite", "scorpion sting", "bee sting"] },
      { key: CATCH_ALL_KEY, label: "All other Diseases" },
    ],
  },
  {
    title: "Re-Attendances and Referrals",
    elements: [
      // Both handled directly in the report query, not via the classifier:
      // "Re-Attendances" counts FOLLOW_UP-type encounters; "Referrals" has
      // no OPD source field and is always 0.
      { key: "re_attendances", label: "Re-Attendances" },
      { key: "referrals", label: "Referrals" },
    ],
  },
];

export const ALL_ELEMENTS: MorbidityElement[] = MORBIDITY_TAXONOMY.flatMap(
  (s) => s.elements
);

// [keyword, elementKey] pairs, longest keyword first so the most specific
// match wins ("malaria in pregnancy" before "malaria", "genital ulcer"
// before "ulcer", "generalized anxiety" before "anxiety").
const KEYWORD_INDEX: { kw: string; key: string }[] = ALL_ELEMENTS.flatMap((el) =>
  (el.keywords ?? []).map((kw) => ({ kw, key: el.key }))
).sort((a, b) => b.kw.length - a.kw.length);

// Non-morbidity reasons that can legitimately appear in a diagnosis field
// (routine care, screening) — these produce no morbidity tally at all.
const EXCLUDE_SUBSTRINGS = [
  "antenatal care",
  "postnatal care",
  "family planning",
  "immunisation",
  "immunization",
  "vaccination",
  "well child",
  "well person",
  "medical examination",
  "health screening",
  "routine check",
  "no abnormality detected",
];

function normalize(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Splits one diagnosis field into individual diagnosis fragments. The
 * Additional Diagnosis field is captured as "comma-separate if more than
 * one"; principal is usually single but is split the same way defensively.
 */
export function splitDiagnoses(field: string | null | undefined): string[] {
  if (!field) return [];
  return field
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Routes a single free-text diagnosis fragment to one morbidity element
 * key. Returns `null` for routine/non-morbidity entries (which should not
 * be counted), or the catch-all key when nothing matches.
 */
export function classifyDiagnosis(raw: string): string | null {
  const t = normalize(raw);
  if (!t) return null;

  if (EXCLUDE_SUBSTRINGS.some((s) => t.includes(s))) return null;

  // Malaria: the GHS form splits it into suspected / tested / positive /
  // negative-but-treated sub-rows plus a pregnancy set. Free text can't
  // support that, so collapse onto the "treated as malaria" / non-lab rows.
  if (t.includes("malaria")) {
    const inPregnancy = t.includes("pregnan");
    const isSevere =
      t.includes("severe") || t.includes("complicated") || t.includes("cerebral malaria");
    if (isSevere) return "severe_malaria_non_lab";
    return inPregnancy ? "malaria_pregnancy_treated" : "uncomplicated_malaria_treated";
  }

  for (const { kw, key } of KEYWORD_INDEX) {
    if (t.includes(kw)) return key;
  }

  return CATCH_ALL_KEY;
}
