export type CareerActionType = "learn" | "practice" | "register" | "find_work" | "guidance";

export type CareerPreparationSubject = {
  subjectName: string;
  guidanceNote: string;
  minimumGrade: string | null;
  sourceUrl: string;
  sourceLocator: string;
  lastVerifiedAt: string;
  isActive: boolean;
};

export type OccupationPathwayAction = {
  id: string;
  actionType: CareerActionType;
  title: string;
  instruction: string;
  whyItHelps: string;
  organizationName: string;
  location: string | null;
  contactText: string | null;
  url: string;
  sourceUrl: string;
  sourceLocator: string;
  lastVerifiedAt: string;
  isVerified: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type OccupationGuidance = {
  industryTransferSummary: string;
  preparationSubjects: CareerPreparationSubject[];
  actions: OccupationPathwayAction[];
  localContentCategories: string[];
  exampleTitles: string[];
};

export const guidanceVerifiedAt = "2026-09-05";

const officialSources = {
  bit: {
    organizationName: "Board of Industrial Training",
    location: "Guyana",
    url: "https://srms.bit.gov.gy/",
    sourceLocator: "Skills training and registration portal",
  },
  gti: {
    organizationName: "Government Technical Institute",
    location: "Georgetown, Guyana",
    url: "https://www.gtigeorgetown.com/",
    sourceLocator: "Institute website",
  },
  threeT: {
    organizationName: "3t Global Guyana",
    location: "Lusignan, Guyana",
    url: "https://www.3tglobal.com/about/our-locations/guyana/",
    sourceLocator: "Guyana training centre",
  },
  enerMech: {
    organizationName: "EnerMech training",
    location: "Guyana and regional centres",
    url: "https://enermech.com/training",
    sourceLocator: "Training course families",
  },
  localContent: {
    organizationName: "Local Content Secretariat",
    location: "Guyana",
    url: "https://lcregister.petroleum.gov.gy/main/",
    sourceLocator: "Supplier and employment registration",
  },
  jobBank: {
    organizationName: "Guyana National Job Bank",
    location: "Guyana",
    url: "https://jobs.gov.gy/",
    sourceLocator: "Job seeker registration and search",
  },
  tvet: {
    organizationName: "Ministry of Education TVET",
    location: "Guyana",
    url: "https://education.gov.gy/web2/index.php/students-resources/technical-vocational-education",
    sourceLocator: "Technical and vocational education resources",
  },
} as const;

function preparationSubject(subjectName: string, guidanceNote: string, sourceUrl = officialSources.tvet.url, sourceLocator = officialSources.tvet.sourceLocator): CareerPreparationSubject {
  return {
    subjectName,
    guidanceNote,
    minimumGrade: null,
    sourceUrl,
    sourceLocator,
    lastVerifiedAt: guidanceVerifiedAt,
    isActive: true,
  };
}

function action(
  id: string,
  actionType: CareerActionType,
  title: string,
  instruction: string,
  whyItHelps: string,
  source: { organizationName: string; location: string | null; url: string; sourceLocator: string },
  sortOrder: number,
  contactText: string | null = null,
): OccupationPathwayAction {
  return {
    id,
    actionType,
    title,
    instruction,
    whyItHelps,
    organizationName: source.organizationName,
    location: source.location,
    contactText,
    url: source.url,
    sourceUrl: source.url,
    sourceLocator: source.sourceLocator,
    lastVerifiedAt: guidanceVerifiedAt,
    isVerified: true,
    isActive: true,
    sortOrder,
  };
}

function commonWorkActions(slug: string, roleNoun: string, practiceNoun: string, learnSource: typeof officialSources.gti | typeof officialSources.bit | typeof officialSources.threeT | typeof officialSources.enerMech | typeof officialSources.tvet) {
  return [
    action(
      `${slug}-learn`,
      "learn",
      `Ask about training for ${roleNoun}`,
      `Use the official ${learnSource.organizationName} link to ask about current intake, entry requirements, costs, and training that builds ${roleNoun.toLowerCase()}.`,
      `A recognised learning route gives you safer foundations and evidence to discuss with an employer.`,
      learnSource,
      1,
    ),
    action(
      `${slug}-practice`,
      "practice",
      `Find supervised ${practiceNoun} experience`,
      `Search the National Job Bank for trainee, assistant, or supervised ${practiceNoun} opportunities. Keep a record of the tasks you complete and the feedback you receive.`,
      `Supervised practice turns classroom learning into work evidence without claiming that school results are a professional qualification.`,
      officialSources.jobBank,
      2,
    ),
    action(
      `${slug}-register`,
      "register",
      "Prepare your local-content profile",
      "Review the Local Content Secretariat employment registration route and confirm which information is needed before submitting anything.",
      "Registration can help you be visible in the local-content ecosystem, but it is not a job offer or eligibility decision.",
      officialSources.localContent,
      3,
    ),
  ];
}

const guidanceBySlug: Record<string, OccupationGuidance> = {
  "engineering-professionals": {
    industryTransferSummary: "Engineering study can transfer into design, reliability, measurement, facilities, and project support for Guyana's petroleum value chain. The next proof is supervised technical work and a recognised engineering route.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports calculations, modelling, measurement, and engineering analysis."),
      preparationSubject("Physics", "Helps explain forces, energy, equipment, and process behaviour."),
      preparationSubject("Technical Drawing", "Builds the ability to read and communicate technical designs."),
    ],
    actions: commonWorkActions("engineering-professionals", "engineering fundamentals", "engineering", officialSources.gti),
    localContentCategories: ["Engineering and Machining", "Surveying", "Environmental Services and Studies"],
    exampleTitles: ["Process Engineer", "Reliability and Optimisation Engineer", "Facilities Engineer"],
  },
  "mineral-processing-plant-operators": {
    industryTransferSummary: "Plant and mineral-processing experience can transfer into safe equipment operation, production checks, and process discipline around industrial and petroleum facilities.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports measurements, rates, quantities, and production checks."),
      preparationSubject("Integrated Science", "Builds a foundation for materials, energy, and process safety."),
      preparationSubject("Technical Drawing", "Helps with equipment layouts and operating instructions."),
    ],
    actions: commonWorkActions("mineral-processing-plant-operators", "plant operations and process safety", "plant operations", officialSources.bit),
    localContentCategories: ["Equipment Rental", "Industrial Cleaning Services - onshore"],
    exampleTitles: ["Plant Operator", "Production Operator", "Process Operator"],
  },
  "sheet-structural-metal-workers-and-welders": {
    industryTransferSummary: "Metalwork and welding can transfer directly into fabrication, pipe work, maintenance, and construction support. Safety records, supervised weld quality, and recognised training matter.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports measurements, angles, quantities, and material planning."),
      preparationSubject("Technical Drawing", "Helps translate drawings into accurate fabrication work."),
      preparationSubject("Integrated Science", "Supports understanding of heat, materials, and safe work."),
    ],
    actions: commonWorkActions("sheet-structural-metal-workers-and-welders", "welding and fabrication", "fabrication", officialSources.gti),
    localContentCategories: ["Pipe Welding - onshore", "Structural Fabrication - onshore", "Engineering and Machining"],
    exampleTitles: ["Welder Fabricator", "Structural Fabricator", "Pipe Welder"],
  },
  "ships-deck-crews": {
    industryTransferSummary: "Deck work can transfer into marine logistics, cargo handling, vessel support, and offshore movement. Safety, sea-readiness, and documented supervised time are important next steps.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports navigation, measurements, loading, and checks."),
      preparationSubject("English A", "Supports clear radio, permit, and safety communication."),
      preparationSubject("Physical Education", "Can support physical readiness for practical deck work."),
    ],
    actions: commonWorkActions("ships-deck-crews", "marine safety and deck operations", "marine operations", officialSources.threeT),
    localContentCategories: ["Ship and Rig Chandlery Services", "Manpower and Crewing Services", "Cargo Management and Monitoring"],
    exampleTitles: ["Deck Crew", "Cargo Supervisor Assistant", "Marine Operations Assistant"],
  },
  "machinery-mechanics-and-repairers": {
    industryTransferSummary: "Vehicle, generator, and machinery repair can transfer into mechanical maintenance, troubleshooting, and equipment reliability across onshore and offshore support.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports measurements, tolerances, and maintenance records."),
      preparationSubject("Integrated Science", "Builds a foundation for engines, fluids, heat, and materials."),
      preparationSubject("Technical Drawing", "Helps interpret parts, assemblies, and maintenance diagrams."),
    ],
    actions: commonWorkActions("machinery-mechanics-and-repairers", "mechanical maintenance and hydraulics", "mechanical maintenance", officialSources.enerMech),
    localContentCategories: ["Equipment Rental", "Engineering and Machining"],
    exampleTitles: ["Mechanical Technician", "Maintenance Operator", "Reliability Technician"],
  },
  "heavy-truck-and-bus-drivers": {
    industryTransferSummary: "Heavy-vehicle driving can transfer into trucking, personnel movement, materials logistics, and disciplined transport support for industrial sites.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports route planning, loads, fuel records, and timekeeping."),
      preparationSubject("English A", "Supports permits, handovers, incident reports, and instructions."),
      preparationSubject("Information Technology", "Helps with digital dispatch and transport records."),
    ],
    actions: commonWorkActions("heavy-truck-and-bus-drivers", "commercial driving and transport safety", "transport", officialSources.bit),
    localContentCategories: ["Transportation Services - Trucking", "Ground Transportation - movement of personnel"],
    exampleTitles: ["Heavy Truck Driver", "Personnel Transport Driver", "Logistics Driver"],
  },
  "ship-and-aircraft-controllers-and-technicians": {
    industryTransferSummary: "Transport control or technical experience can transfer into marine, aviation, asset-control, and safety-critical support where precise procedures and communication are essential.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports navigation, measurement, timing, and technical checks."),
      preparationSubject("Physics", "Helps explain motion, forces, energy, and equipment behaviour."),
      preparationSubject("English A", "Supports procedures, radio communication, and shift handovers."),
    ],
    actions: commonWorkActions("ship-and-aircraft-controllers-and-technicians", "transport systems and safety procedures", "transport technical", officialSources.gti),
    localContentCategories: ["Aviation Support Services", "Engineering and Machining"],
    exampleTitles: ["Marine Technician", "Aviation Support Technician", "Control Technician"],
  },
  "finance-professionals": {
    industryTransferSummary: "Finance experience can transfer into cost control, procurement, accounting, supplier administration, and compliance support for Guyana's petroleum supply chain.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports budgets, reconciliations, rates, and cost analysis."),
      preparationSubject("English A", "Supports contracts, reports, and clear supplier communication."),
      preparationSubject("Information Technology", "Supports spreadsheets, systems, and digital records."),
    ],
    actions: commonWorkActions("finance-professionals", "accounting, procurement, and cost control", "commercial support", officialSources.tvet),
    localContentCategories: ["Local Accounting Services", "Local Insurance Services"],
    exampleTitles: ["Cost Controller", "Buyer (Supply Chain)", "Accounts Assistant"],
  },
  "physical-and-engineering-science-technicians": {
    industryTransferSummary: "Science and technical practice can transfer into equipment checks, measurement, field support, laboratory work, and production operations.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports measurement, calibration, calculations, and records."),
      preparationSubject("Physics", "Builds understanding of instruments, energy, and equipment."),
      preparationSubject("Chemistry", "Can support materials, fluids, samples, and process awareness."),
    ],
    actions: commonWorkActions("physical-and-engineering-science-technicians", "technical operations and measurement", "technical operations", officialSources.gti),
    localContentCategories: ["Engineering and Machining", "Metrology Services"],
    exampleTitles: ["GP Operator", "Electrical Technician", "Field Technician"],
  },
  "process-control-technicians": {
    industryTransferSummary: "Controls and instrumentation experience can transfer into monitoring, measurement, alarms, and safe process operations in industrial facilities.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports readings, set points, trends, and calculations."),
      preparationSubject("Physics", "Helps explain sensors, signals, energy, and process behaviour."),
      preparationSubject("Information Technology", "Supports digital control systems and data records."),
    ],
    actions: commonWorkActions("process-control-technicians", "instrumentation and control systems", "controls and instrumentation", officialSources.gti),
    localContentCategories: ["Engineering and Machining", "ICT - network installation and support services"],
    exampleTitles: ["Control Room Operator", "Instrument and Controls Technician", "Process Control Technician"],
  },
  "administration-professionals": {
    industryTransferSummary: "Administration experience can transfer into materials, personnel, document, procurement, and facilities coordination for contractors and operating companies.",
    preparationSubjects: [
      preparationSubject("English A", "Supports records, reports, correspondence, and coordination."),
      preparationSubject("Mathematics", "Supports invoices, stock counts, schedules, and reconciliation."),
      preparationSubject("Information Technology", "Supports digital document and inventory systems."),
    ],
    actions: commonWorkActions("administration-professionals", "administration, logistics, and records", "administrative and logistics", officialSources.tvet),
    localContentCategories: ["Administrative Support and Facilities Management Services", "Storage Services (warehousing)"],
    exampleTitles: ["Assistant Storekeeper", "Materials Logistics Coordinator", "Personnel Logistics Coordinator"],
  },
  "other-health-professionals": {
    industryTransferSummary: "Health experience can transfer into occupational health, site wellness, emergency response, and worker-support services where confidentiality and safety practice matter.",
    preparationSubjects: [
      preparationSubject("Biology", "Supports people, health, and body-system foundations."),
      preparationSubject("English A", "Supports patient communication, records, and incident reporting."),
      preparationSubject("Chemistry", "Can support health, materials, and environmental awareness."),
    ],
    actions: commonWorkActions("other-health-professionals", "occupational health and emergency response", "health support", officialSources.tvet),
    localContentCategories: ["Medical Services"],
    exampleTitles: ["Occupational Health Assistant", "Site Health Support", "Emergency Response Assistant"],
  },
  "architects-planners-surveyors-and-designers": {
    industryTransferSummary: "Design, planning, and surveying can transfer into site preparation, project documentation, measurements, and facilities work across the petroleum value chain.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports surveying, quantities, geometry, and project checks."),
      preparationSubject("Technical Drawing", "Supports plans, drawings, and construction communication."),
      preparationSubject("Information Technology", "Supports digital design, mapping, and project records."),
    ],
    actions: commonWorkActions("architects-planners-surveyors-and-designers", "surveying and project documentation", "surveying and design", officialSources.gti),
    localContentCategories: ["Surveying", "Engineering and Machining"],
    exampleTitles: ["Survey Technician", "Project Designer", "Facilities Planner"],
  },
  "mining-and-construction-labourers": {
    industryTransferSummary: "Construction and site work can transfer into civil works, structural support, equipment assistance, and safe industrial site preparation.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports measurements, quantities, and site checks."),
      preparationSubject("Integrated Science", "Builds awareness of materials, energy, and safe work."),
      preparationSubject("Technical Drawing", "Helps interpret simple plans and site instructions."),
    ],
    actions: commonWorkActions("mining-and-construction-labourers", "construction safety and site skills", "construction", officialSources.bit),
    localContentCategories: ["Construction Work for Buildings - onshore", "Structural Fabrication - onshore", "Equipment Rental"],
    exampleTitles: ["Construction Labourer", "Site Assistant", "Equipment Assistant"],
  },
  "painters-and-building-cleaners": {
    industryTransferSummary: "Painting, cleaning, and facilities work can transfer into industrial cleaning, surface preparation, coatings, accommodation, and safe site support.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports quantities, mixing ratios, measurements, and schedules."),
      preparationSubject("Integrated Science", "Helps with materials, chemicals, ventilation, and safe handling."),
      preparationSubject("English A", "Supports work instructions, permits, and incident reporting."),
    ],
    actions: commonWorkActions("painters-and-building-cleaners", "industrial cleaning and surface preparation", "facilities support", officialSources.bit),
    localContentCategories: ["Industrial Cleaning Services - onshore", "Pipe Sand Blasting and Coating - onshore", "Janitorial and Laundry Services"],
    exampleTitles: ["Industrial Cleaner", "Coating Assistant", "Facilities Support Worker"],
  },
  "shop-salespersons": {
    industryTransferSummary: "Customer service and sales can transfer into supply counters, parts support, procurement coordination, and commercial services serving industrial companies.",
    preparationSubjects: [
      preparationSubject("Mathematics", "Supports stock counts, prices, orders, and reconciliation."),
      preparationSubject("English A", "Supports customer, supplier, and order communication."),
      preparationSubject("Information Technology", "Supports point-of-sale, inventory, and procurement systems."),
    ],
    actions: commonWorkActions("shop-salespersons", "commercial, stock, and customer support", "commercial support", officialSources.tvet),
    localContentCategories: ["Local Marketing and Advertising Services (public relations)"],
    exampleTitles: ["Parts Counter Assistant", "Supply Store Salesperson", "Customer Service Assistant"],
  },
  cooks: {
    industryTransferSummary: "Cooking experience can transfer into catering, food supply, camp hospitality, hygiene, and disciplined service for worksites and marine operations.",
    preparationSubjects: [
      preparationSubject("English A", "Supports menus, records, instructions, and team communication."),
      preparationSubject("Mathematics", "Supports portions, stock, costing, and schedules."),
      preparationSubject("Integrated Science", "Supports hygiene, food safety, and safe handling."),
    ],
    actions: commonWorkActions("cooks", "food safety and industrial catering", "catering", officialSources.bit),
    localContentCategories: ["Catering Services", "Food Supply", "Accommodation Services (apartments and houses)"],
    exampleTitles: ["Camp Cook", "Catering Assistant", "Food Services Assistant"],
  },
  "environmental-and-occupational-health-professionals": {
    industryTransferSummary: "Environmental, health, and hygiene experience can transfer into HSE support, environmental monitoring, occupational health, and compliance work around petroleum operations.",
    preparationSubjects: [
      preparationSubject("Biology", "Supports health, ecosystems, and human-impact foundations."),
      preparationSubject("Chemistry", "Supports materials, samples, pollution, and safe handling."),
      preparationSubject("English A", "Supports audits, reports, procedures, and worker communication."),
    ],
    actions: commonWorkActions("environmental-and-occupational-health-professionals", "HSE, environmental, and occupational health", "HSE and environmental", officialSources.enerMech),
    localContentCategories: ["Environmental Services and Studies", "Medical Services", "Security Services"],
    exampleTitles: ["HSSE Specialist", "Environmental Field Assistant", "Occupational Health Assistant"],
  },
};

export function getOccupationGuidance(slug: string): OccupationGuidance | null {
  const guidance = guidanceBySlug[slug];
  if (!guidance) return null;
  return {
    ...guidance,
    preparationSubjects: guidance.preparationSubjects.map((subject) => ({ ...subject })),
    actions: guidance.actions.map((item) => ({ ...item })),
    localContentCategories: [...guidance.localContentCategories],
    exampleTitles: [...guidance.exampleTitles],
  };
}

export function getAllOccupationGuidance(): Array<{ slug: string; guidance: OccupationGuidance }> {
  return Object.keys(guidanceBySlug).map((slug) => ({ slug, guidance: getOccupationGuidance(slug)! }));
}
