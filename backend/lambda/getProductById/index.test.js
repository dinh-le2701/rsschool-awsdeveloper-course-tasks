const { handler } = require('./index');
const { products } = require('./mockData');

describe('getProductById Lambda function', () => {
  const defaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  test('should handle OPTIONS request', async () => {
    const event = { httpMethod: 'OPTIONS' };
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(defaultHeaders);
    expect(response.body).toBe('');
  });

  test('should return 400 when productId is missing', async () => {
    const event = {
      httpMethod: 'GET',
      pathParameters: null
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual(defaultHeaders);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product ID is required'
    });
  });

  test('should return 404 when product is not found', async () => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { productId: 'nonexistent-id' }
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(response.headers).toEqual(defaultHeaders);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product not found'
    });
  });

  test('should return product when found', async () => {
    // Assuming there's a product in mockData
    const testProduct = products[0];
    const event = {
      httpMethod: 'GET',
      pathParameters: { productId: testProduct.id }
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(defaultHeaders);
    expect(JSON.parse(response.body)).toEqual(testProduct);
  });

  test('should return 500 when an error occurs', async () => {
    // Mock products to throw an error
    jest.spyOn(products, 'find').mockImplementation(() => {
      throw new Error('Test error');
    });

    const event = {
      httpMethod: 'GET',
      pathParameters: { productId: '123' }
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual(defaultHeaders);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Internal server error'
    });

    // Clean up mock
    jest.restoreAllMocks();
  });
});
