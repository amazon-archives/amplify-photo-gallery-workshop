+++
title = "Creating a Photo Processor Lambda function"
chapter = false
weight = 10
+++

Let's make a photo processor lambda function so that we can resize our photos.

{{% notice warning %}}
We're about to run `amplify function add` and answer some interactive questions so that Amplify will help create an appropriate Cloud Formation template for our lambda function.  
<br/>
When following the instructions below, **you must name your lambda function _workshopphotoprocessor_**. Later, we'll edit some CloudFormation templates, and the function name **workshopphotoprocessor** is hard coded to make it easier for this workshop (less edits that you'll have to do).
<br/>
<br/>
**Amplify will also ask us if we want to access other resources created in this project from this new Lambda function.** **Say No to this prompt.**  You might think we want to say 'Yes' here, because Amplify will then generate appropriate IAM access policies to allow our photo processor lambda function to access the photos in our S3 bucket.  However, we're going to be making a few other modifications to the default Cloud Formation template that Amplify generates, and so in this case, it's going to be easier if we just say 'No' to this question because we'll copy/paste sufficient configuration changes to the generated Cloud Formation template in the next step.
{{% /notice %}}


1. **From the photoalbums directory, run:** `amplify function add` and respond to the prompts the same way as shown below. 

1. Make sure you **press Enter before continuing to step 3 after following these prompts**:
	```text
	$ amplify function add
	Using service: Lambda, provided by: awscloudformation


	? Provide a friendly name for your resource to be used as a label for this category in the project: 

	workshopphotoprocessor


	? Provide the AWS Lambda function name: 

	workshopphotoprocessor


	? Choose the function template that you want to use: 

	Hello world function

    ? Do you want to access other resources created in this project from your Lambda function? 
	
	No


	? Do you want to edit the local lambda function now? 

	Yes


	Please manually edit the file created at /home/ec2-user/environment/photoalbums/amplify/backend/function/workshopphotoprocessor/src/index.js

	? Press enter to continue 

	<Enter>

	Successfully added resource workshopphotoprocessor locally.
	```


2. **Replace /home/ec2-user/environment/photoalbums/amplify/backend/function/workshopphotoprocessor/src/index.js** with the following:
<div style="height: 560px; overflow-y: scroll; margin: 0;">
{{< highlight js >}}
// amplify/backend/function/workshopphotoprocessor/src/index.js

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


3. **Replace /home/ec2-user/environment/photoalbums/amplify/backend/function/workshopphotoprocessor/src/package.json** with the following:
```json
{
	"name": "workshopphotoprocessor",
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


5. **Create photoalbums/amplify/backend/function/workshopphotoprocessor/parameters.json** and paste this content into it:
```json
{
	"S3UserfilesBucketName": "REPLACE_WITH_USERFILES_BUCKET_NAME",
	"DynamoDBPhotosTableArn": "REPLACE_WITH_DYNAMO_PHOTOS_TABLE_ARN"
}
```

6. In *parameters.json* that you just created, replace **REPLACE_WITH_USERFILES_BUCKET_NAME** with the name of the S3 Userfiles bucket created by Amplify. 

	To find this value, look in **photoalbums/src/aws-exports.js** and find the **aws_user_files_s3_bucket** key.


7. In *parameters.json*, also replace **REPLACE_WITH_DYNAMO_PHOTOS_TABLE_ARN** with the name ARN of the DynamoDB table used by AppSync for the Photo data type.
   
	To find this value, go to the **Data Sources** section in your AppSync API console, find the **PhotoTable** entry and click on the link in its **Resource** column (which takes you to the associated DynamoDB table), then look in the bottom of the Overview tab for the ARN of the table.


8.  **Replace photoalbums/amplify/backend/function/workshopphotoprocessor/workshopphotoprocessor-cloudformation-template.json** with the following:
<div style="height: 550px; overflow-y: scroll;">
{{< highlight json "hl_lines=4-14 29-36 100-183">}}
{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Description": "Lambda resource stack creation using Amplify CLI",
	"Parameters": {
		"env": {
            "Type": "String"
        },
		"S3UserfilesBucketName": {
			"Type": "String"
		},
		"DynamoDBPhotosTableArn": {
			"Type": "String"
		}
	},
	"Resources": {
		"LambdaFunction": {
			"Type": "AWS::Lambda::Function",
			"Properties": {
				"Handler": "index.handler",
				"FunctionName": "workshopphotoprocessor",
				"Role": {
					"Fn::GetAtt": [
						"LambdaExecutionRole",
						"Arn"
					]
				},
				"Runtime": "nodejs8.10",
				"Timeout": "25",
				"Environment": {
					"Variables": {
						"ENV": {"Ref": "env"},
						"THUMBNAIL_WIDTH": "80",
						"THUMBNAIL_HEIGHT": "80",
						"DYNAMODB_PHOTOS_TABLE_ARN": { "Ref": "DynamoDBPhotosTableArn" }
					}
				}
			}
		},
		"LambdaExecutionRole": {
			"Type": "AWS::IAM::Role",
			"Properties": {
				"RoleName": "photoalbumsLambdaRole91d2faf3",
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
		"AllPrivsForPhotoAlbums": {
			"DependsOn": [
				"LambdaExecutionRole"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "AllPrivsForPhotoAlbums",
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
								"s3:*"
							],
							"Resource": {
								"Fn::Sub": [
									"arn:aws:s3:::${S3UserfilesBucketName}/*",
									{
										"S3UserfilesBucketName": {
											"Ref": "S3UserfilesBucketName"
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
							"Resource": {
								"Ref": "DynamoDBPhotosTableArn"
							}
						}
					]
				}
			}
		},
		"RekognitionDetectLabels": {
			"DependsOn": [ "LambdaExecutionRole" ],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "RekognitionDetectLabels",
				"Roles": [ { "Ref": "LambdaExecutionRole" } ],
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
		}
	}
}
{{< /highlight >}}
</div>

9. **From the photoalbums directory, run:** `amplify push` to deploy our new function.

10. Wait for the deploy to finish. This step usually only takes about a minute or two.

### What we changed
- Created a *parameters.json* file to pass some values into the Photo Processor function's CloudFormation template

- Added parameters *env*, *S3UserfilesBucketName*, and *DynamoDBPhotosTableArn* to the Photo Processor function's CloudFormation template

- Added environment variables to the Photo Processor function's configuration: *ENV*, *THUMBNAIL_WIDTH*, *THUMBNAIL_HEIGHT*, *DYNAMODB_PHOTOS_TABLE_ARN*

- Added an *AllPrivsForPhotoAlbums* IAM policy to grant the function's role read and write access to the S3 bucket containing our photos

- Added an *AllPrivsForDynamo* IAM policy to grant the function's role read and write access to the DynamoDB table containing information about our photos

- Added a *RekognitionDetectLabels* IAM policy to grant the function's role permission to use the detectLabels API from Amazon Rekognition. This policy isn't used yet, but we're going to add it here for convenience while we're working with this file so we won't need to come back and add it when we get to the next section that involves automatically tagging our photos with AI.

{{% notice warning %}}
The AWS Amplify CLI manages the cloud resources in our project by generating CloudFormation templates for us. CloudFormation templates are very helpful, because they specify all of our project's infrastrucutre as code in the form of JSON and/or YAML files. In this workshop, we'll continue to make edits to some of these generated CloudFormation templates like we did in the steps above. 
<br/> <br/>
Beware that not all changes are safe to make, and the Amplify CLI may overwrite edits you make in some CloudFormation templates. All of the changes we make in this workshop will persist and won't get overwritten by Amplify because we're not issuing any commands to re-configure or remove any of the resources we're editing, but it's good to remember that this sort of thing _can_ happen if you attempt to use the CLI to re-configure a resource you've already generated with Amplify.
{{% /notice %}}