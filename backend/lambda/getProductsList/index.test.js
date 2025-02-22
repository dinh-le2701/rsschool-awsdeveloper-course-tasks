// index.test.js
const { handler } = require('./index');
const { products } = require('./mockData');

describe('getProductsList Lambda handler', () => {
  // Test successful response
  test('should return products list with 200 status code', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request-id'
      }
    };

    const response = await handler(event);
    const parsedBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(parsedBody).toEqual(products);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
  });


  // Test handling of missing requestContext
  test('should handle missing requestContext gracefully', async () => {
    const event = {};
    
    const response = await handler(event);
    const parsedBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(parsedBody).toEqual(products);
  });

  // Test response headers
  test('should include correct CORS headers', async () => {
    const event = {};
    
    const response = await handler(event);

    expect(response.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    });
  });

  

  test("should handle errors", async () => {
    jest.spyOn(Array, "isArray").mockImplementation(() => false);

    jest.mock("./mockData", () => ({
      products: null,
    }));

    const event = {
      requestContext: {
        requestId: "test-request-id", 
      },
    };

 
    const result = await handler(event);

  
    expect(result.statusCode).toBe(500);

   
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Internal server error");
    expect(body.requestId).toBe("test-request-id"); 
  });
});
