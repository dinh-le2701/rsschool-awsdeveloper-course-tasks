const cdk = require("aws-cdk-lib");
const { WebsiteStack } = require("../lib/stack");

const app = new cdk.App();
new WebsiteStack(app, "WebsiteStack", {
  env: {
    region: "us-east-1",
  },
});
