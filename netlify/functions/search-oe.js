export async function handler(event, context) {
    const { topic, phase, consequence, source, severity, search } = event.queryStringParameters || {};
  
    // Sample OE records database / live proxy synthesizer
    const records = [
      {
        id: "OE-2024-104",
        title: "Asbestos Abatement Line Rupture During Boiler Decommissioning",
        sourceFamily: "OSHA",
        projectPhase: "Decommissioning",
        primaryTopic: "Industrial Safety",
        consequence: "Worker Exposure",
        severity: "High",
        date: "2024-06-12",
        summary: "Inadequate containment verification before structural cut operations resulted in localized asbestos pipe insulation shear.",
        lessons: "Enforce dual-signoff isolation tags and air quality monitoring prior to heavy equipment penetration."
      },
      {
        id: "OE-2024-098",
        title: "Uncontrolled Ammonia Tank Vapor Venting",
        sourceFamily: "CSB",
        projectPhase: "Chemical Removal",
        primaryTopic: "Chemical Safety",
        consequence: "Offsite Release",
        severity: "High",
        date: "2024-04-29",
        summary: "Vessel purging procedure omitted thermal expansion calculations for residual anhydrous ammonia in closed piping.",
        lessons: "Update P&ID checklists for line-breaking during de-inventorying phases."
      },
      {
        id: "OE-2023-142",
        title: "Structural Collapse During Upper Gantry Demolition",
        sourceFamily: "NIOSH",
        projectPhase: "Demolition",
        primaryTopic: "Demolition Operations",
        consequence: "Equipment Damage",
        severity: "Medium",
        date: "2023-11-04",
        summary: "Premature removal of structural load-bearing crossbeams created unbalanced fatigue during crane rigging.",
        lessons: "Mandate structural engineering sign-off prior to removing secondary bracing."
      },
      {
        id: "OE-2023-088",
        title: "Lead Dust Migration During Sandblasting Prep",
        sourceFamily: "EPA",
        projectPhase: "Environmental Remediation",
        primaryTopic: "Environmental",
        consequence: "Regulatory Penalty",
        severity: "Low",
        date: "2023-08-15",
        summary: "Negative pressure enclosure failed due to unsealed duct connection on HEPA exhaust fan.",
        lessons: "Implement daily smoke-testing protocols for containment barriers."
      }
    ];
  
    // Filter logic
    let filtered = records.filter(r => {
      if (topic && topic !== "All" && r.primaryTopic !== topic) return false;
      if (phase && phase !== "All" && r.projectPhase !== phase) return false;
      if (consequence && consequence !== "All" && r.consequence !== consequence) return false;
      if (source && source !== "All" && r.sourceFamily !== source) return false;
      if (severity && severity !== "All" && r.severity !== severity) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.summary.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        status: "success",
        count: filtered.length,
        data: filtered
      })
    };
  }