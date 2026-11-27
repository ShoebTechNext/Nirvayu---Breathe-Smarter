import type {
  AqiCategoryKey,
  CleanAirPlan,
  HouseholdProfile,
  ImpactAction,
  Language,
} from "./types";

interface FallbackInput {
  placeName: string;
  indianAqi: number;
  category: AqiCategoryKey;
  pm25: number;
  bestWindow: {
    startHour: string;
    endHour: string;
    expectedAqi: number;
  };
  profile: HouseholdProfile;
  language: Language;
}

export function buildFallbackPlan(input: FallbackInput): CleanAirPlan {
  const { placeName, indianAqi, category, bestWindow, profile, language } = input;
  const hi = language === "hi";
  const isSevereOrVeryPoor = category === "very_poor" || category === "severe";
  const isPoorOrWorse =
    category === "poor" || category === "very_poor" || category === "severe";

  const extraCareGroups: string[] = [];
  if (profile.childrenUnder5) {
    extraCareGroups.push(hi ? "5 वर्ष से कम उम्र के बच्चे" : "Children under 5");
  }
  if (profile.elderly) {
    extraCareGroups.push(hi ? "बुजुर्ग सदस्य (60+)" : "Elderly family members (60+)");
  }
  if (profile.respiratoryConditions) {
    extraCareGroups.push(
      hi ? "अस्थमा या सांस की समस्या वाले लोग" : "People with asthma or respiratory conditions"
    );
  }
  if (profile.pregnancy) {
    extraCareGroups.push(hi ? "गर्भवती महिलाएं" : "Pregnant women");
  }
  if (extraCareGroups.length === 0) {
    extraCareGroups.push(
      hi
        ? "बाहरी कामकाजी लोग और सुबह सैर करने वाले"
        : "Outdoor commuters and morning exercisers"
    );
  }

  const headline = isSevereOrVeryPoor
    ? hi
      ? `${placeName} में वायु गुणवत्ता गंभीर है (AQI ${indianAqi}) — घर के अंदर रहें`
      : `Severe air alert in ${placeName} (AQI ${indianAqi}) — minimize outdoor exposure`
    : isPoorOrWorse
      ? hi
        ? `${placeName} में हवा खराब है (AQI ${indianAqi}) — बाहर N95 मास्क पहनें`
        : `Poor air in ${placeName} (AQI ${indianAqi}) — wear an N95 mask outdoors`
      : hi
        ? `${placeName} में हवा आज संभालने योग्य है (AQI ${indianAqi})`
        : `Manageable air quality in ${placeName} today (AQI ${indianAqi})`;

  const summary = isPoorOrWorse
    ? hi
      ? `लगातार स्मॉग और PM2.5 के उच्च स्तर के कारण सुबह और देर शाम की सैर टालें। बाहर केवल आवश्यक काम के लिए ${bestWindow.startHour}–${bestWindow.endHour} के बीच निकलें और सील किए गए N95/KN95 मास्क का उपयोग करें।`
      : `Elevated PM2.5 traps smog near ground level during cool mornings and evenings. Shift essential errands to ${bestWindow.startHour}–${bestWindow.endHour} (est. AQI ${bestWindow.expectedAqi}) and wear a well-fitted N95 mask.`
    : hi
      ? `हवा की स्थिति मध्यम से अच्छी है। ताजी हवा के लिए दोपहर की खिड़की में क्रॉस-वेंटिलेशन करें और रसोई में धुआं कम रखें।`
      : `Air quality is currently manageable. Ventilate rooms during the cleaner midday window (${bestWindow.startHour}–${bestWindow.endHour}) and keep indoor cooking smoke low.`;

  // Impact calculations following transparent formulas documented in "How Impact is Calculated"
  const actions: ImpactAction[] = [];

  if (profile.commuteType === "two_wheeler" || profile.commuteType === "car") {
    actions.push({
      id: "shift_commute",
      title: hi
        ? "सप्ताह में 3 दिन मेट्रो/बस या कारपूल अपनाएं"
        : "Switch 3 trips/week to Metro, Bus, or Carpool",
      pm25ReductionPct: 14,
      co2SavedKgPerWeek: profile.commuteType === "car" ? 11.4 : 4.2,
      assumption: hi
        ? "औसत 16 किमी/दिन आने-जाने पर 140g CO2/किमी (कार) या 52g CO2/किमी (दोपहिया) की बचत।"
        : "Assumes 16 km/day commute replaced 3 days/week (140g CO2/km car, 52g/km two-wheeler).",
    });
  } else {
    actions.push({
      id: "clean_window_errands",
      title: hi
        ? `बाहरी काम ${bestWindow.startHour}–${bestWindow.endHour} के बीच करें`
        : `Time outdoor errands to ${bestWindow.startHour}–${bestWindow.endHour}`,
      pm25ReductionPct: 18,
      co2SavedKgPerWeek: 1.5,
      assumption: hi
        ? "सुबह/शाम के पीक स्मॉग (25-35% अधिक PM2.5) से बचकर दैनिक इनहेल्ड डोज़ में कमी।"
        : "Avoids peak morning/evening inversion smog when surface PM2.5 spikes 25–35%.",
    });
  }

  if (profile.cookingFuel === "biomass") {
    actions.push({
      id: "clean_cooking",
      title: hi
        ? "चूल्हे/लकड़ी की जगह LPG या इंडक्शन का उपयोग"
        : "Replace biomass/wood stove with LPG or Induction",
      pm25ReductionPct: 35,
      co2SavedKgPerWeek: 18.5,
      assumption: hi
        ? "बंद रसोई में लकड़ी/उपले का धुआं PM2.5 का बड़ा स्रोत है; स्वच्छ ईंधन से भारी कमी आती है।"
        : "Solid biomass cooking drives extreme indoor PM2.5; shifting to LPG/induction cuts indoor exposure ~35%.",
    });
  } else {
    actions.push({
      id: "cooking_ventilation",
      title: hi
        ? "खाना बनाते समय चिमनी/एग्जॉस्ट और ढक्कन का उपयोग"
        : "Use exhaust fan, open kitchen vent & lid-covered cooking",
      pm25ReductionPct: 15,
      co2SavedKgPerWeek: 2.1,
      assumption: hi
        ? "ढक्कन लगाकर पकाने से 20% कम गैस लगती है और तड़के के PM2.5 धुएं में ~15% की कमी आती है।"
        : "Lid-covered cooking trims LPG energy ~20% while exhaust vents frying PM2.5 plumes.",
    });
  }

  actions.push({
    id: "diy_or_purifier",
    title: profile.hasAirPurifier
      ? hi
        ? "बेडरूम में HEPA प्यूरीफायर + गीला पोंछा"
        : "Run bedroom HEPA purifier + wet mopping (no dry sweeping)"
      : hi
        ? "DIY बॉक्स-फैन HEPA फिल्टर + गीला पोंछा"
        : "DIY box-fan MERV-13/HEPA filter + wet mopping",
    pm25ReductionPct: profile.hasAirPurifier ? 28 : 22,
    co2SavedKgPerWeek: 0.8,
    assumption: hi
      ? "बंद कमरे में HEPA फिल्ट्रेशन और गीले पोंछे से धूल का पुनः उड़ना 22–28% तक घटता है।"
      : "Enclosed-room filtration + damp mopping prevents dust resuspension, cutting indoor PM2.5 by 22–28%.",
  });

  actions.push({
    id: "n95_and_no_burn",
    title: hi
      ? "N95 मास्क पहनें और सूखे पत्ते/कचरा न जलाएं"
      : "Fitted N95 mask outdoors + zero leaf/waste burning",
    pm25ReductionPct: 16,
    co2SavedKgPerWeek: 6.4,
    assumption: hi
      ? "सही फिटेड N95 मास्क 90%+ PM2.5 रोकता है (बाहर बिताए समय के अनुपात में ~16% शुद्ध लाभ)।"
      : "Well-fitted N95 filters >90% particles outdoors (~16% net daily dose reduction) & avoids open-burn toxic smoke.",
  });

  // Combine independent PM2.5 reductions multiplicatively so total never exceeds realistic 80%
  let remainingExposure = 1;
  let totalCo2 = 0;
  for (const a of actions) {
    remainingExposure *= 1 - a.pm25ReductionPct / 100;
    totalCo2 += a.co2SavedKgPerWeek;
  }
  const totalPm25ReductionPct = Math.min(
    78,
    Math.round((1 - remainingExposure) * 100)
  );

  return {
    healthAdvisory: {
      riskLevel: category,
      headline,
      summary,
      extraCareGroups,
      disclaimer: hi
        ? "यह जानकारी पर्यावरण और जन-स्वास्थ्य मार्गदर्शन पर आधारित अनुमान है, चिकित्सा सलाह नहीं। लक्षण बढ़ने पर डॉक्टर से संपर्क करें।"
        : "These recommendations and impact numbers are lifestyle estimates, not medical advice. Consult a doctor if symptoms worsen.",
    },
    dailyRoutine: [
      {
        period: "morning",
        title: hi ? "सुबह (6:00 – 10:30)" : "Morning (6:00 AM – 10:30 AM)",
        timeWindow: "06:00 – 10:30",
        guidance: isPoorOrWorse
          ? hi
            ? "सुबह की सैर और दौड़ बंद रखें। खिड़कियां बंद रखें और घर के अंदर हल्का योग या स्ट्रेचिंग करें।"
            : "Skip outdoor jogging; cold morning air traps smoke near ground. Keep windows shut and do indoor stretching/yoga."
          : hi
            ? "हल्की सैर ठीक है, पर मुख्य सड़कों के भारी ट्रैफिक से दूरी रखें।"
            : "Light outdoor walk is fine; prefer parks away from busy road junctions.",
        outdoorOk: !isPoorOrWorse,
      },
      {
        period: "afternoon",
        title: hi ? "दोपहर (सबसे साफ समय)" : "Afternoon (Cleanest Window)",
        timeWindow: `${bestWindow.startHour} – ${bestWindow.endHour}`,
        guidance: hi
          ? `आज का सबसे बेहतर समय ${bestWindow.startHour}–${bestWindow.endHour} (अनुमानित AQI ${bestWindow.expectedAqi}) है। 20 मिनट के लिए खिड़कियां खोलें और जरूरी बाहरी काम निपटाएं।`
          : `Best air window today is ${bestWindow.startHour}–${bestWindow.endHour} (est. AQI ${bestWindow.expectedAqi}). Cross-ventilate rooms for 20 mins and finish outdoor errands now.`,
        outdoorOk: !isSevereOrVeryPoor,
      },
      {
        period: "evening",
        title: hi ? "शाम और रात (18:00 – 23:00)" : "Evening & Night (6:00 PM – 11:00 PM)",
        timeWindow: "18:00 – 23:00",
        guidance: isPoorOrWorse
          ? hi
            ? "सूर्यास्त के बाद तापमान गिरने से स्मॉग फिर बढ़ता है। खिड़कियों के नीचे गीला कपड़ा या ड्राफ्ट-स्टॉपर लगाएं और अगरबत्ती/धूपबत्ती न जलाएं।"
            : "Smog thickens after sunset as inversion sets in. Seal window gaps, avoid incense/agarbatti or mosquito coils, and run air filtration in bedrooms."
          : hi
            ? "शाम की सैर छोटे रखें और सोने से पहले कमरे की हवा साफ रखें।"
            : "Keep evening walks brief near traffic, and avoid indoor smoke sources before bedtime.",
        outdoorOk: category === "good" || category === "satisfactory",
      },
    ],
    indoorHacks: [
      {
        id: "hack_windows",
        category: "windows",
        title: hi ? "स्मार्ट वेंटिलेशन समय" : "Smart Window Timing",
        description: hi
          ? `सुबह-शाम खिड़कियां बंद रखें; केवल ${bestWindow.startHour}–${bestWindow.endHour} के बीच हवा बदलें। दरवाजों के नीचे ड्राफ्ट-सील लगाएं।`
          : `Keep windows closed during morning/night smog; air out for 20 mins only during ${bestWindow.startHour}–${bestWindow.endHour}.`,
        costLevel: "low",
      },
      {
        id: "hack_diy_filter",
        category: "diy_filter",
        title: profile.hasAirPurifier
          ? hi
            ? "प्यूरीफायर प्री-फिल्टर साफ़ करें"
            : "Clean Purifier Pre-Filter Weekly"
          : hi
            ? "कम-लागत DIY बॉक्स-फैन फिल्टर"
            : "Low-Cost DIY Fan + HEPA/MERV-13 Filter",
        description: profile.hasAirPurifier
          ? hi
            ? "बेडरूम के दरवाजे बंद रखकर प्यूरीफायर को ऑटो/मीडियम मोड पर चलाएं और हर हफ्ते जाली साफ करें।"
            : "Run your purifier in a closed bedroom on medium speed and vacuum the pre-filter mesh weekly to preserve CADR."
          : hi
            ? "टेबल या बॉक्स फैन के पीछे एक MERV-13 या रिप्लेसमेंट HEPA फिल्टर टेप से लगाएं — ₹1,200–₹1,800 में एक कमरे की हवा साफ करता है।"
            : "Tape a MERV-13 or replacement HEPA cartridge behind a box/pedestal fan (~₹1,200–₹1,800) to scrub PM2.5 in one bedroom.",
        costLevel: profile.budget === "high" ? "medium" : "low",
      },
      {
        id: "hack_cleaning",
        category: "cleaning",
        title: hi ? "झाड़ू नहीं, गीला पोंछा लगाएं" : "Wet Mop Instead of Dry Sweeping",
        description: hi
          ? "सूखी झाड़ू बारीक धूल (PM10/PM2.5) को फिर हवा में उड़ाती है। रोज गीले कपड़े से पोंछा और डस्टिंग करें।"
          : "Dry jhaadu/broom kicks settled PM10 and heavy metals back into breathing height. Damp-mop floors daily.",
        costLevel: "low",
      },
      {
        id: "hack_cooking",
        category: "cooking",
        title: hi ? "रसोई धुआं नियंत्रण" : "Kitchen Smoke Control",
        description: hi
          ? "तड़का लगाते समय एग्जॉस्ट फैन चलाएं, बर्तन ढककर पकाएं और रसोई की खिड़की थोड़ी खुली रखें।"
          : "Turn on the exhaust fan during tadka/frying, cover pots with lids, and keep indoor agarbatti/candles unlit.",
        costLevel: "low",
      },
      {
        id: "hack_mask",
        category: "mask",
        title: hi ? "N95 बनाम कपड़े का मास्क" : "N95 vs Cloth Mask Guidance",
        description: hi
          ? "कपड़े या सर्जिकल मास्क PM2.5 के सूक्ष्म कणों को नहीं रोकते। नाक के पास कसकर फिट होने वाला N95/FFP2 मास्क ही चुनें।"
          : "Cloth and loose surgical masks let >70% of PM2.5 pass through. Use a snug, nose-pin fitted N95/FFP2 respirator outdoors.",
        costLevel: "low",
      },
      {
        id: "hack_plants",
        category: "plants",
        title: hi ? "सहायक इंडोर पौधे (सीमित अपेक्षा)" : "Indoor Plants (Supportive Role)",
        description: hi
          ? "स्नेक प्लांट, एरेका पाम और मनी प्लांट नमी व ताजगी देते हैं, पर PM2.5 घटाने के लिए फिल्ट्रेशन और कम धुएं पर ही भरोसा करें।"
          : "Areca palm, snake plant & money plant boost indoor humidity and calm, though mechanical filtration is still essential for PM2.5.",
        costLevel: "low",
      },
    ],
    sustainableAlternatives: [
      {
        id: "alt_commute",
        area: "commute",
        title: hi
          ? "मेट्रो / सिटी बस / साझा सवारी"
          : "Metro, Electric Bus, or Shared Commute",
        description: hi
          ? "सप्ताह में 2-3 दिन निजी गाड़ी छोड़कर सार्वजनिक परिवहन या कारपूल अपनाने से सड़क की धूल और टेलपाइप धुआं दोनों घटते हैं।"
          : "Swapping 2–3 solo bike/car commutes per week for Metro, bus, or carpool cuts both personal exposure and street emissions.",
        costLevel: "low",
        difficulty: "easy",
      },
      {
        id: "alt_cooking",
        area: "cooking",
        title: hi
          ? "प्रेशर कुकर + इंडक्शन / स्वच्छ LPG"
          : "Pressure Cooking + Induction / Clean LPG",
        description: hi
          ? "सौर या इंडक्शन पर चाय-दाल बनाना और प्रेशर कुकर का उपयोग करना कमरा साफ रखता है और ईंधन बचाता है।"
          : "Using a pressure cooker and induction kettle for tea/dal trims fuel use by ~25% and prevents indoor NO2 buildup.",
        costLevel: profile.budget === "low" ? "low" : "medium",
        difficulty: "easy",
      },
      {
        id: "alt_heating",
        area: "heating",
        title: hi
          ? "अंगीठी/लकड़ी की जगह थर्मल लेयरिंग"
          : "Thermal Layering Over Coal/Wood Angithi",
        description: hi
          ? "सर्दियों में बंद जगह पर कोयला या लकड़ी जलाने से खतरनाक CO और PM2.5 बनता है। गर्म कपड़े, हॉट-वॉटर बैग या सुरक्षित ऑयल हीटर चुनें।"
          : "Avoid indoor coal/wood angithis which emit lethal CO and PM2.5; use wool layering, hot-water bags, or thermostat oil heaters.",
        costLevel: "low",
        difficulty: "easy",
      },
      {
        id: "alt_waste",
        area: "waste",
        title: hi
          ? "कचरा व सूखे पत्ते न जलाएं (कम्पोस्ट करें)"
          : "Zero Waste/Leaf Burning — Compost Instead",
        description: hi
          ? "मोहल्ले में सूखे पत्ते या प्लास्टिक जलाने से डाइऑक्सिन और भारी स्मॉग फैलता है; RWA/नगर निगम के साथ कम्पोस्ट पिट का उपयोग करें।"
          : "Open burning of dry leaves or plastic multiplies neighborhood PM2.5; mulch leaves into garden compost and report open burning.",
        costLevel: "low",
        difficulty: "medium",
      },
    ],
    impactEstimator: {
      totalPm25ReductionPct,
      totalCo2SavedKgPerWeek: Number(totalCo2.toFixed(1)),
      actions,
      methodologyNote: hi
        ? "ये अनुमान CPCB एक्सपोज़र मॉडल, भारतीय परिवहन उत्सर्जन कारकों (g CO2/किमी) और इंडोर फिल्ट्रेशन दक्षता अध्ययनों पर आधारित हैं।"
        : "Estimates combine multiplicative indoor/outdoor PM2.5 dose reduction factors with India-specific transport and cooking CO2 emission factors.",
    },
    checklist: [
      {
        id: "chk_mask",
        label: hi
          ? "बाहर निकलते समय फिटेड N95 मास्क पहनें"
          : "Wear a snug N95 mask for any outdoor commute",
        points: 20,
      },
      {
        id: "chk_window",
        label: hi
          ? `सिर्फ ${bestWindow.startHour}–${bestWindow.endHour} में खिड़कियां खोलें`
          : `Open windows only during ${bestWindow.startHour}–${bestWindow.endHour}`,
        points: 15,
      },
      {
        id: "chk_mop",
        label: hi
          ? "सूखी झाड़ू की जगह गीला पोंछा लगाएं"
          : "Wet-mop floors instead of dry sweeping",
        points: 15,
      },
      {
        id: "chk_cook",
        label: hi
          ? "रसोई में एग्जॉस्ट फैन चलाकर और ढककर पकाएं"
          : "Cook with exhaust fan on and lids covered",
        points: 15,
      },
      {
        id: "chk_commute",
        label: hi
          ? "आज कम-प्रदूषण वाला सफर (मेट्रो/बस/पैदल/WFH) चुनें"
          : "Choose a low-emission trip (Metro/bus/carpool/WFH)",
        points: 25,
      },
      {
        id: "chk_noburn",
        label: hi
          ? "कोई धूपबत्ती, कोयला या कचरा न जलाएं"
          : "Zero incense smoke, coal angithi, or waste burning",
        points: 10,
      },
    ],
    fallbackMode: true,
  };
}
