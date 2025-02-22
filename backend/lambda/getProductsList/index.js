const { products } = require("./mockData");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // Create response builder helper
  const createResponse = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body),
  });

  try {
    // Input validation
    if (!Array.isArray(products)) {
      throw new Error("Products data is not properly formatted");
    }

    // Log request details
    console.log("Request received:", {
      requestId: event?.requestContext?.requestId,
      timestamp: new Date().toISOString(),
    });

    // Return products list
    return createResponse(200, products);
  } catch (error) {
    // Enhanced error logging
    console.error("Error in getProductsList:", {
      error: error.message,
      stack: error.stack,
      requestId: event?.requestContext?.requestId,
    });

    return createResponse(500, {
      message: "Internal server error",
      requestId: event?.requestContext?.requestId, // Add request tracking
    });
  }
};
