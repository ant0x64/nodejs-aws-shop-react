import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";

export class StaticStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "RSS-Task2-Static-Bucket", {
      bucketName: "rss-task2-static-bucket",
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bucketOAI = new cloudfront.OriginAccessIdentity(
      this,
      "RSS-Task2-Static-Bucket-OAI"
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            bucketOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const front = new cloudfront.CloudFrontWebDistribution(
      this,
      "RSS-Task2-Static-CloudFront",
      {
        originConfigs: [
          {
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: bucketOAI,
            },
          },
        ],
      }
    );

    new s3deployment.BucketDeployment(
      this,
      "RSS-Task2-Static-Bucket-Deployment",
      {
        sources: [s3deployment.Source.asset("./dist")],
        destinationBucket: bucket,
        distribution: front,
        distributionPaths: ["/*"],
      }
    );

    new cdk.CfnOutput(this, "S3BucketUrl", {
      value: "S3 Bucket url:" + bucket.bucketWebsiteUrl,
    });

    new cdk.CfnOutput(this, "CloudfrontDomain", {
      value: "Cloudfront domain:" + front.distributionDomainName,
    });
  }
}
