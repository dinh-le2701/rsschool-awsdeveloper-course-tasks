#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyShopStack } from "../lib/my-shop-stack";

const app = new cdk.App();
new MyShopStack(app, "MyShopStack", {
  env: { region: "us-east-1" }, // Thay đổi region nếu cần
});
