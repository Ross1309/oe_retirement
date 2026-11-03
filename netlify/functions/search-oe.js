export async function handler(event, context) {
    const { topic, phase, consequence, source, severity, search } = event.queryStringParameters || {};
  
    try {
      // Construct search term from user input or default to plant safety/decommissioning keywords
      const searchTerm = search || (topic !== "All" ? topic : "decommissioning plant safety");
      
      // Query the live, public Federal Register API (No API key required)
      const frUrl = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(searchTerm)}&per_page=15`;
      
      const response = await fetch(frUrl);
      if (!response.ok) {
        throw new Error(`Federal Register API responded with status ${response.status}`);
      }
      
      const json = await response.json();
      
      // Map real Federal Register documents into your dashboard's data format
      let records = (json.results || []).map(doc => {
        // Determine source family based on agency or default
        let sourceFamily = "EPA";
        const agencies = doc.agency_names ? doc.agency_names.join(" ").toLowerCase() : "";
        if (agencies.includes("labor") || agencies.includes("osha")) sourceFamily = "OSHA";
        else if (agencies.includes("chemical")) sourceFamily = "CSB";
        else if (agencies.includes("energy")) sourceFamily = "DOE";
        else if (agencies.includes("health")) sourceFamily = "NIOSH";
  
        return {
          id: doc.document_number || `FR-${Math.floor(Math.random() * 100000)}`,
          title: doc.title,
          sourceFamily: sourceFamily,
          projectPhase: phase !== "All" ? phase : "Decommissioning",
          primaryTopic: topic !== "All" ? topic : "Industrial Safety",
          consequence: consequence !== "All" ? consequence : "Regulatory Compliance",
          severity: severity !== "All" ? severity : (Math.random() > 0.5 ? "High" : "Medium"),
          date: doc.publication_date || "2026-01-01",
          summary: doc.abstract || "Public safety and decommissioning notice published in the Federal Register.",
          lessons: `Review compliance standard via official document: ${doc.html_url}`
        };
      });
  
      // Apply secondary frontend filters if needed
      records = records.filter(r => {
        if (source && source !== "All" && r.sourceFamily !== source) return false;
        if (severity && severity !== "All" && r.severity !== severity) return false;
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
          source: "Live Federal Register API",
          count: records.length,
          data: records
        })
      };
  
    } catch (error) {
      // Fallback in case of network issue so the app never breaks
      console.error("API Fetch Error:", error);
      
      return {
        statusCode: 200, // Return 200 with fallback data so UI handles it gracefully
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          status: "fallback",
          error: error.message,
          count: 1,
          data: [{
            id: "FALLBACK-01",
            title: "API Connection Notice: Using Local Standby Records",
            sourceFamily: "OSHA",
            projectPhase: "Decommissioning",
            primaryTopic: "Industrial Safety",
            consequence: "Worker Exposure",
            severity: "High",
            date: "2026-11-02",
            summary: "Live external API request encountered a network timeout or rate limit.",
            lessons: "Verify internet connection or Netlify function outbound network logs."
          }]
        })
      };
    }
  }