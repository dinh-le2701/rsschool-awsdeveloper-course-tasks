import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";

export class MyShopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1️⃣ Tạo S3 bucket để lưu frontend build
    const siteBucket = new s3.Bucket(this, "MyShopBucket", {
      websiteIndexDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, // Chặn ACL nhưng vẫn public được qua bucket policy
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Xóa bucket khi stack bị xóa
    });

    // 2️⃣ Cấp quyền public đọc file từ S3
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${siteBucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()], // Cho phép public đọc
      })
    );

    // 3️⃣ Tạo CloudFront distribution để cache nội dung
    const distribution = new cloudfront.Distribution(
      this,
      "MyShopDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3StaticWebsiteOrigin(siteBucket), // Dùng S3BucketOrigin thay vì S3Origin
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
      }
    );

    // 4️⃣ Deploy React build lên S3
    new s3Deploy.BucketDeployment(this, "DeployMyShop", {
      sources: [s3Deploy.Source.asset("../dist")], // Đường dẫn đến thư mục build của React
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // 5️⃣ Xuất URL để dễ truy cập
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, "S3WebsiteURL", {
      value: siteBucket.bucketWebsiteUrl,
    });
  }
}
