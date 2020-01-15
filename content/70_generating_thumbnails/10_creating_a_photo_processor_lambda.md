+++
title = "Creating a Photo Processor Lambda function"
chapter = false
weight = 10
+++

Remember the Lambda function we created earlier? Now it's time to modify it so it can resize our uploded photos into thumbnails.

{{% notice warning %}}
The instructions below use the text _S3Triggerxxxxxxx_ to indicate a pattern in your folders and files that you'll need to look for.
<br/><br/>
**The folders and files are not actually called S3Triggerxxxxxxx** but rather something like _S3Trigger1a2b3c4_ or similar, so please look
in your filesystem to find the appropriate files. Hopefully it will be pretty obvious as you look for the files; there should only be
one match for each of the items mentioned below.
{{% /notice %}}



1. **Replace /home/ec2-user/environment/photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/index.js** with the following:
<div style="height: 560px; overflow-y: scroll; margin: 0;">
{{< highlight js >}}
// amplify/backend/function/S3Triggerxxxxxxx/src/index.js

const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const DynamoDBDocClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuidv4 = require('uuid/v4');

/*
Note: Sharp requires native extensions to be installed in a way that is compatible
with Amazon Linux (in order to run successfully in a Lambda execution environment).

If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
*/
const Sharp = require('sharp');

// We'll expect these environment variables to be defined when the Lambda function is deployed
const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH, 10);
const THUMBNAIL_HEIGHT = parseInt(process.env.THUMBNAIL_HEIGHT, 10);
const DYNAMODB_PHOTOS_TABLE_NAME = process.env.DYNAMODB_PHOTOS_TABLE_ARN.split('/')[1];

function storePhotoInfo(item) {
	const params = {
		Item: item,
		TableName: DYNAMODB_PHOTOS_TABLE_NAME
	};
	return DynamoDBDocClient.put(params).promise();
}

async function getMetadata(bucketName, key) {
	const headResult = await S3.headObject({Bucket: bucketName, Key: key }).promise();
	return headResult.Metadata;
}

function thumbnailKey(filename) {
	return `public/resized/${filename}`;
}

function fullsizeKey(filename) {
	return `public/${filename}`;
}

function makeThumbnail(photo) {
	return Sharp(photo).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).toBuffer();
}

async function resize(bucketName, key) {
	const originalPhoto = (await S3.getObject({ Bucket: bucketName, Key: key }).promise()).Body;
	const originalPhotoName = key.replace('uploads/', '');
	const originalPhotoDimensions = await Sharp(originalPhoto).metadata();

	const thumbnail = await makeThumbnail(originalPhoto);

	await Promise.all([
		S3.putObject({
			Body: thumbnail,
			Bucket: bucketName,
			Key: thumbnailKey(originalPhotoName),
		}).promise(),

		S3.copyObject({
			Bucket: bucketName,
			CopySource: bucketName + '/' + key,
			Key: fullsizeKey(originalPhotoName),
		}).promise(),
	]);

	await S3.deleteObject({
		Bucket: bucketName,
		Key: key
	}).promise();

	return {
		photoId: originalPhotoName,
		
		thumbnail: {
			key: thumbnailKey(originalPhotoName),
			width: THUMBNAIL_WIDTH,
			height: THUMBNAIL_HEIGHT
		},

		fullsize: {
			key: fullsizeKey(originalPhotoName),
			width: originalPhotoDimensions.width,
			height: originalPhotoDimensions.height
		}
	};
};

async function processRecord(record) {
	const bucketName = record.s3.bucket.name;
	const key = record.s3.object.key;
	
	if (key.indexOf('uploads') != 0) return;
	
	const metadata = await getMetadata(bucketName, key);
	const sizes = await resize(bucketName, key);    
	const id = uuidv4();
	const item = {
		id: id,
		owner: metadata.owner,
		photoAlbumId: metadata.albumid,
		bucket: bucketName,
		thumbnail: sizes.thumbnail,
		fullsize: sizes.fullsize,
		createdAt: new Date().getTime()
	}
	await storePhotoInfo(item);
}

exports.handler = async (event, context, callback) => {
	try {
		event.Records.forEach(processRecord);
		callback(null, { status: 'Photo Processed' });
	}
	catch (err) {
		console.error(err);
		callback(err);
	}
};
{{< /highlight >}}
</div>


3. **Replace /home/ec2-user/environment/photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/package.json** with the following:
```json
{
	"name": "S3TriggerPhotoProcessor",
	"version": "1.0.0",
	"description": "The photo uploads processor",
	"main": "index.js",
	"dependencies": {
		"sharp": "^0.20.2",
		"uuid": "^3.3.2"
	}
}
```


4. **From the photoalbums directory, run:** `amplify function build` and press Enter to confirm. This will take care of installing the dependencies in our Lambda function's package.json.


8.  **Replace photoalbums/amplify/backend/function/S3Triggerxxxxxxx/S3Triggerxxxxxxx-cloudformation-template.json** with the following:
<div style="height: 550px; overflow-y: scroll;">
{{< highlight json "hl_lines=4-14 29-36 100-183">}}
{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Description": "Lambda resource stack creation using Amplify CLI",
	"Parameters": {
		"env": {
			"Type": "String"
		},
		"DynamoDBPhotoTableArn": {
			"Type": "String",
			"Default": "DYNAMODB_PHOTO_TABLE_ARN_PLACEHOLDER"
		}
	},
	"Conditions": {
		"ShouldNotCreateEnvResources": {
			"Fn::Equals": [
				{
					"Ref": "env"
				},
				"NONE"
			]
		}
	},
	"Resources": {
		"LambdaFunction": {
			"Type": "AWS::Lambda::Function",
			"Metadata": {
				"aws:asset:path": "./src",
				"aws:asset:property": "Code"
			},
			"Properties": {
				"Handler": "index.handler",
				"FunctionName": {
					"Fn::If": [
						"ShouldNotCreateEnvResources",
						"S3_TRIGGER_NAME_PLACEHOLDER",
						{
							"Fn::Join": [
								"",
								[
									"S3_TRIGGER_NAME_PLACEHOLDER",
									"-",
									{
										"Ref": "env"
									}
								]
							]
						}
					]
				},
				"Environment": {
					"Variables": {
						"ENV": {
							"Ref": "env"
						},
						"THUMBNAIL_WIDTH": "80",
						"THUMBNAIL_HEIGHT": "80",
						"DYNAMODB_PHOTOS_TABLE_ARN": { "Ref" : "DynamoDBPhotoTableArn" }
					}
				},
				"Role": {
					"Fn::GetAtt": [
						"LambdaExecutionRole",
						"Arn"
					]
				},
				"Runtime": "nodejs10.x",
				"Timeout": "25"
			}
		},
		"LambdaExecutionRole": {
			"Type": "AWS::IAM::Role",
			"Properties": {
				"RoleName": {
					"Fn::If": [
						"ShouldNotCreateEnvResources",
						"S3_TRIGGER_NAME_PLACEHOLDERLambdaRole66924eb7",
						{
							"Fn::Join": [
								"",
								[
									"S3_TRIGGER_NAME_PLACEHOLDERLambdaRole66924eb7",
									"-",
									{
										"Ref": "env"
									}
								]
							]
						}
					]
				},
				"AssumeRolePolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Principal": {
								"Service": [
									"lambda.amazonaws.com"
								]
							},
							"Action": [
								"sts:AssumeRole"
							]
						}
					]
				}
			}
		},
		"lambdaexecutionpolicy": {
			"DependsOn": [
				"LambdaExecutionRole"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "lambda-execution-policy",
				"Roles": [
					{
						"Ref": "LambdaExecutionRole"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"logs:CreateLogGroup",
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": {
								"Fn::Sub": [
									"arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*",
									{
										"region": {
											"Ref": "AWS::Region"
										},
										"account": {
											"Ref": "AWS::AccountId"
										},
										"lambda": {
											"Ref": "LambdaFunction"
										}
									}
								]
							}
						}
					]
				}
			}
		},
		"AllPrivsForDynamo": {
			"DependsOn": [
				"LambdaExecutionRole"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "AllPrivsForDynamo",
				"Roles": [
					{
						"Ref": "LambdaExecutionRole"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"dynamodb:*"
							],
							"Resource": { "Ref" : "DynamoDBPhotoTableArn" }
						}
					]
				}
			}
		},
		"RekognitionDetectLabels": {
			"DependsOn": [
				"LambdaExecutionRole"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "RekognitionDetectLabels",
				"Roles": [
					{
						"Ref": "LambdaExecutionRole"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"rekognition:detectLabels"
							],
							"Resource": "*"
						}
					]
				}
			}
		}
	},
	"Outputs": {
		"Name": {
			"Value": {
				"Ref": "LambdaFunction"
			}
		},
		"Arn": {
			"Value": {
				"Fn::GetAtt": [
					"LambdaFunction",
					"Arn"
				]
			}
		},
		"Region": {
			"Value": {
				"Ref": "AWS::Region"
			}
		},
		"LambdaExecutionRole": {
			"Value": {
				"Ref": "LambdaExecutionRole"
			}
		}
	}
}
{{< /highlight >}}
</div>

9. The Cloud Formation template you just pasted above contains some placeholder text that needs to be replaced with values specific for your environment. **Run the following commands** on the terminal of your Cloud9 IDE from the same **photoalbums** directory you've been working on:
	```bash
	AMPLIFY_ENV=$(jq -r '.envName' amplify/.config/local-env-info.json)

	REGION=$(jq -r '.providers.awscloudformation.Region' amplify/backend/amplify-meta.json)

	STACK_ID=$(jq -r '.providers.awscloudformation.StackId' amplify/backend/amplify-meta.json)

	ACCOUNT_ID=$(echo $STACK_ID | sed -r 's/^arn:aws:(.+):(.+):(.+):stack.+$/\3/')

	API_ID=$(jq -r '.api.photoalbums.output.GraphQLAPIIdOutput' amplify/backend/amplify-meta.json)

	DYNAMO_DB_PHOTO_TABLE_ARN="arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/Photo-$API_ID-$AMPLIFY_ENV"

	S3_TRIGGER_NAME=$(jq -r '.function | to_entries[] | .key' amplify/backend/amplify-meta.json)

	sed -i "s/S3_TRIGGER_NAME_PLACEHOLDER/$S3_TRIGGER_NAME/g" amplify/backend/function/$S3_TRIGGER_NAME/$S3_TRIGGER_NAME-cloudformation-template.json

	sed -i "s,DYNAMODB_PHOTO_TABLE_ARN_PLACEHOLDER,$DYNAMO_DB_PHOTO_TABLE_ARN,g" amplify/backend/function/$S3_TRIGGER_NAME/$S3_TRIGGER_NAME-cloudformation-template.json
	```

9. **From the photoalbums directory, run:** `amplify push` to deploy our new function.

10. Wait for the deploy to finish. This step usually only takes about a minute or two.

### What we changed
- Added parameters *env*, *DynamoDBPhotosTableArn* to the Photo Processor function's CloudFormation template

- Added environment variables to the Photo Processor function's configuration: *THUMBNAIL_WIDTH*, *THUMBNAIL_HEIGHT*, *DYNAMODB_PHOTOS_TABLE_ARN*

- Added an *AllPrivsForDynamo* IAM policy to grant the function's role read and write access to the DynamoDB table containing information about our photos

- Added a *RekognitionDetectLabels* IAM policy to grant the function's role permission to use the detectLabels API from Amazon Rekognition. This policy isn't used yet, but we're going to add it here for convenience while we're working with this file so we won't need to come back and add it when we get to the next section that involves automatically tagging our photos with AI.

{{% notice warning %}}
The AWS Amplify CLI manages the cloud resources in our project by generating CloudFormation templates for us. CloudFormation templates are very helpful, because they specify all of our project's infrastrucutre as code in the form of JSON and/or YAML files. In this workshop, we'll continue to make edits to some of these generated CloudFormation templates like we did in the steps above. 
<br/> <br/>
Beware that not all changes are safe to make, and the Amplify CLI may overwrite edits you make in some CloudFormation templates. All of the changes we make in this workshop will persist and won't get overwritten by Amplify because we're not issuing any commands to re-configure or remove any of the resources we're editing, but it's good to remember that this sort of thing _can_ happen if you attempt to use the CLI to re-configure a resource you've already generated with Amplify.
{{% /notice %}}

### Try uploading another photo

With these changes completed, we should be able to upload a photo and see our Photo Processor function execute automatically. Try uploading a photo to an album, wait a moment, then refresh the page to see if the album renders the newly uploaded photo. If you see a photo, it means that our Photo Processor function was automatically triggered by the upload, it created a thumbnail, and it added all of the photo information to the DynamoDB table that our AppSync API reads from for resolving Photos. 

Refreshing the album view in order to see new photos isn’t a great user experience, but this workshop has a lot of material already and there’s still more to cover in the next section, too. In short, one way to handle this with another AppSync subscription would be to have our photo processor Lambda function trigger a mutation on our AppSync API, and to have the AlbumDetailsLoader component subscribe to that mutation. However, because we’re using Amazon Cognito User Pool authentication for our AppSync API, the only way to have our Lambda function trigger such a mutation would be to create a sort of ‘system’ user (through the normal user sign up and confirmation process), store that user’s credentials securely (perhaps in AWS Secrets Manager), and authenticate to our AppSync API as that user inside our Lambda in order to trigger the mutation. For simplicity's sake, we'll stick to just refreshing the album view for this workshop.
