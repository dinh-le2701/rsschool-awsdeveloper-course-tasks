const cdk = require("aws-cdk-lib");
const { Stack } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");

class WebsiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create S3 bucket for website hosting
    const websiteBucket = this.createWebsiteBucket();

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(websiteBucket);

    // Deploy website content
    this.deployWebsiteContent(websiteBucket, distribution);

    // Create Lambda functions
    const { getProductsListLambda, getProductByIdLambda } =
      this.createLambdaFunctions();

    // Create API Gateway and endpoints
    this.createApiGateway(getProductsListLambda, getProductByIdLambda);
  }

  createWebsiteBucket() {
    return new s3.Bucket(this, "MyShopBucket", {
      bucketName: "my-shop-bucket-task3-dl",
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED, // Adding encryption
    });
  }

  createCloudFrontDistribution(websiteBucket) {
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(this, "CustomCachePolicy", {
          minTtl: cdk.Duration.seconds(1),
          maxTtl: cdk.Duration.days(365),
          defaultTtl: cdk.Duration.days(1),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    return distribution;
  }

  createLambdaFunctions() {
    const getProductsListLambda = new lambda.Function(
      this,
      "getProductsList",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/getProductsList")
        ),
        timeout: cdk.Duration.seconds(30), // Adding timeout
        memorySize: 128, // Optimizing memory allocation
      }
    );

    const getProductByIdLambda = new lambda.Function(
      this,
      "getProductById",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/getProductById")
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 128,
      }
    );

    return { getProductsListLambda, getProductByIdLambda };
  }

  createApiGateway(getProductsListLambda, getProductByIdLambda) {
    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /products endpoint
    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda)
    );

    // Create /products/{productId} endpoint
    const product = products.addResource("{productId}");
    product.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIdLambda)
    );

    // Grant permissions
    this.grantApiGatewayPermissions(
      api,
      getProductsListLambda,
      getProductByIdLambda
    );
  }

  grantApiGatewayPermissions(api, getProductsListLambda, getProductByIdLambda) {
    getProductsListLambda.addPermission("APIGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi("GET", "/products"),
    });

    getProductByIdLambda.addPermission("APIGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi("GET", "/products/{productId}"),
    });
  }

  deployWebsiteContent(websiteBucket, distribution) {
    new s3deploy.BucketDeployment(this, "WebsiteDeployment", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../frontend/dist"))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}

module.exports = { WebsiteStack };
