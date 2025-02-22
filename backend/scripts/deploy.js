const { execSync } = require("child_process");
const path = require("path");

function execute(command, cwd) {
  try {
    execSync(command, {
      stdio: "inherit",
      cwd: cwd || process.cwd(),
      env: { ...process.env }, // Ensure environment variables are passed through
    });
  } catch (error) {
    console.error(`Failed to execute ${command}`);
    console.error("Error details:", error.message);
    if (error.stdout) console.error("stdout:", error.stdout.toString());
    if (error.stderr) console.error("stderr:", error.stderr.toString());
    process.exit(1);
  }
}

async function deploy() {
  try {
    // Build and deploy app
    console.log("Installing app dependencies...");
    execute(
      "npm install --legacy-peer-deps",
      path.join(__dirname, "../../frontend")
    );

    console.log("Building application...");
    execute("npm run build", path.join(__dirname, "../../frontend"));

    // Deploy infrastructure
    console.log("Installing CDK dependencies...");
    execute("npm install --legacy-peer-deps");

    console.log("Building CDK...");
    execute("npm run build");

    console.log("Deploying infrastructure...");
    execute("cdk deploy --require-approval never");

    // Invalidate CloudFront cache
    console.log("Invalidating CloudFront cache...");
    execute("npm run invalidate-cache");

    console.log("\nDeployment completed successfully!");
    console.log("You can find the CloudFront URL in the stack outputs above");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deploy();
