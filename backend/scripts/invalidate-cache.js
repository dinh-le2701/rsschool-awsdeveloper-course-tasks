const { CloudFrontClient, ListDistributionsCommand, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");

async function invalidateCache() {
  try {
    // Initialize CloudFront client
    const cloudfront = new CloudFrontClient();
    
    // List all distributions
    const listCommand = new ListDistributionsCommand({});
    const distributions = await cloudfront.send(listCommand);
    
    // Find the distribution with your bucket name
    const distribution = distributions.DistributionList.Items.find(
      dist => dist.Origins.Items.some(origin => 
        origin.DomainName.includes('huntertigerx')
      )
    );

    if (!distribution) {
      throw new Error('Distribution not found');
    }

    // Create invalidation
    const invalidateCommand = new CreateInvalidationCommand({
      DistributionId: distribution.Id,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: ['/*']
        }
      }
    });

    const result = await cloudfront.send(invalidateCommand);
    console.log('Cache invalidation created:', result.Invalidation.Id);
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
    process.exit(1);
  }
}

invalidateCache();
