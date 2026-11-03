export async function handler(event, context) {
    const { topic, phase, consequence, source, severity, search, page } = event.queryStringParameters || {};
  
    try {
      let searchTerms = [];
      if (search) searchTerms.push(search);
      if (topic && topic !== "All") searchTerms.push(topic);
      if (phase && phase !== "All") searchTerms.push(phase);
      if (consequence && consequence !== "All") searchTerms.push(consequence);
      
      let agencyQuery = "";
      if (source && source !== "All") {
        if (source === "OSHA") agencyQuery = " Occupational Safety and Health Administration";
        else if (source === "EPA") agencyQuery = " Environmental Protection Agency";
        else if (source === "DOE") agencyQuery = " Department of Energy";
        else if (source === "NRC") agencyQuery = " Nuclear Regulatory Commission";
        else if (source === "CSB") agencyQuery = " Chemical Safety Board";
        else if (source === "NIOSH") agencyQuery = " National Institute for Occupational Safety and Health";
      }
  
      const queryTerm = searchTerms.length > 0 ? searchTerms.join(" ") + agencyQuery : "plant decommissioning safety demolition" + agencyQuery;
      const pageNum = page || 1;
      
      const frUrl = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(queryTerm)}&per_page=50&page=${pageNum}`;
      
      const response = await fetch(frUrl);
      if (!response.ok) {
        throw new Error(`Federal Register API responded with status ${response.status}`);
      }
      
      const json = await response.json();
      
      let records = (json.results || []).map((doc, index) => {
        const agencyList = doc.agency_names || [];
        const agencyString = agencyList.join(", ");
        const lowerAgencies = agencyString.toLowerCase();
        const titleLower = (doc.title || "").toLowerCase();
        const pubDate = doc.publication_date || "2026-01-01";
        const pubYear = pubDate.split("-")[0];
        
        let sourceFamily = "EPA";
        if (lowerAgencies.includes("labor") || lowerAgencies.includes("occupational safety") || lowerAgencies.includes("osha")) {
          sourceFamily = "OSHA";
        } else if (lowerAgencies.includes("nuclear regulatory commission") || lowerAgencies.includes("nrc") || titleLower.includes("nuclear") || titleLower.includes("reactor")) {
          sourceFamily = "NRC";
        } else if (lowerAgencies.includes("energy") || lowerAgencies.includes("doe")) {
          sourceFamily = "DOE";
        } else if (lowerAgencies.includes("chemical safety") || lowerAgencies.includes("csb")) {
          sourceFamily = "CSB";
        } else if (lowerAgencies.includes("health") || lowerAgencies.includes("niosh") || lowerAgencies.includes("cdc")) {
          sourceFamily = "NIOSH";
        } else if (lowerAgencies.includes("environmental") || lowerAgencies.includes("epa")) {
          sourceFamily = "EPA";
        }
  
        if (source && source !== "All") {
          sourceFamily = source;
        }
  
        const docUrl = doc.html_url || `https://www.federalregister.gov/d/${doc.document_number}`;
  
        return {
          id: doc.document_number || `FR-${index}`,
          title: doc.title,
          docType: doc.type || "Notice",
          publicationYear: pubYear,
          sourceFamily: sourceFamily,
          projectPhase: phase && phase !== "All" ? phase : (titleLower.includes("demolition") ? "Demolition" : "Decommissioning"),
          primaryTopic: topic && topic !== "All" ? topic : (titleLower.includes("nuclear") ? "Radiation Protection" : "Industrial Safety"),
          consequence: consequence && consequence !== "All" ? consequence : "Regulatory Compliance",
          severity: doc.type === "Rule" ? "High" : (doc.type === "Proposed Rule" ? "Medium" : "Low"),
          date: pubDate,
          summary: doc.abstract || `${agencyString || 'Federal Agency'}: Notice regarding plant operations, regulatory safety standards, and compliance guidelines.`,
          lessons: `Official Record / Citation: ${doc.citation || 'Federal Register Document'} - Link: ${docUrl}`
        };
      });
  
      if (source && source !== "All") {
        records = records.filter(r => r.sourceFamily === source);
      }
      if (severity && severity !== "All") {
        records = records.filter(r => r.severity === severity);
      }
  
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({
          status: "success",
          count: records.length,
          hasMore: records.length === 50,
          data: records
        })
      };
  
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch live records", details: error.message })
      };
    }
  }