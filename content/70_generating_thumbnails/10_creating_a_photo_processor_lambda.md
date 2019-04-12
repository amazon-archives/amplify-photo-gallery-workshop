+++
title = "사진을 처리하는 람다 함수 만들기"
chapter = false
weight = 10
+++

사진 처리 람다 함수를 만들어서 사진을 리사이즈 할 수 있게 합니다.

{{% notice warning %}}
아래 지시를 따를 때에 **람다 함수명을 반드시 _workshopphotoprocessor_ 으로 합니다**.
<br/>
<br/>
이후에 몇가지 클라우드 포메이션 템플릿을 수정하고, 이름이 **workshopphotoprocessor**인 함수는 이번 워크샵을 위해 하드 코딩합니다(꼭 수정할 부분을 줄이기 위해)
{{% /notice %}}

1. **photo-albums 디렉토리에서** `amplify function add`를 실행해서 아래 보여진 것과 비슷한 방식으로 프롬프트에 답합니다. 두번째 단계를 계속하기 전에 엔터를 꼭 눌러야 합니다.
	```text
	$ amplify function add
	Using service: Lambda, provided by: awscloudformation


	? Provide a friendly name for your resource to be used as a label for this category in the project: 

	workshopphotoprocessor


	? Provide the AWS Lambda function name: 

	workshopphotoprocessor


	? Choose the function template that you want to use: 

	Hello world function


	? Do you want to edit the local lambda function now? 
	Yes

	Please manually edit the file created at /home/ec2-user/environment/photo-albums/amplify/backend/function/workshopphotoprocessor/src/index.js

	? Press enter to continue 
	<Enter>

	Successfully added resource workshopphotoprocessor locally.
	```


2. **/home/ec2-user/environment/photo-albums/amplify/backend/function/workshopphotoprocessor/src/index.js** 파일을 다음 내용으로 변경합니다.
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


3. **/home/ec2-user/environment/photo-albums/amplify/backend/function/workshopphotoprocessor/src/package.json** 파일 내용을 다음으로 바꿉니다.
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


4. **photo-albums 디렉토리에서** `amplify function build`를 실행하고 엔터를 눌러 확인합니다. 람다 함수의 package.json에 종속 패키지를 설치합니다.


5. **photo-albums/amplify/backend/function/workshopphotoprocessor/parameters.json** 파일을 생성하고 다음 내용을 넣습니다.
```json
{
	"S3UserfilesBucketName": "REPLACE_WITH_USERFILES_BUCKET_NAME",
	"DynamoDBPhotosTableArn": "REPLACE_WITH_DYNAMO_PHOTOS_TABLE_ARN"
}
```

6. 생성한 *parameters.json* 파일에서 **REPLACE_WITH_USERFILES_BUCKET_NAME** 부분은 Amplify가 생성한 S3 유저 파일 버킷 이름으로 바꿉니다.

	이 값은 **photo-albums/src/aws-exports.js** 파일에서 **aws_user_files_s3_bucket** 항목의 키 값으로 찾을 수 있습니다.


7. *parameters.json* 파일에서 **REPLACE_WITH_DYNAMO_PHOTOS_TABLE_ARN** 부분은 AppSync에서 사진 데이터 타입을 위해 사용하는 DynamoDB 테이블의 ARN으로 바꿉니다.
   
	이 값은 AppSync API 콘솔에서 **Data Sources** 섹션에서, **PhotoTable** 항목을 찾고 **Resource** 컬럼의 링크를 클릭하면(연관된 DynamoDB 테이블을 찾는), Overview 탭의 아래쪽의 테이블의 ARN으로 찾을 수 있습니다.


8.  **photo-albums/amplify/backend/function/workshopphotoprocessor/workshopphotoprocessor-cloudformation-template.json** 를 다음 내용으로 변경합니다.
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

9. **photo-albums 디렉터리에서** `amplify push` 실행하여 새 함수를 배포합니다.

10. 배포를 마칠 때까지 기다립니다. 이 단계는 1~2분 정도 소요됩니다.

### 변경된 것
- 사진 처리 함수의 클라우드포메이션 템플릿에 값을 전달해줄 *parameters.json* 파일을 생성하였습니다.

- 사진 처리 함수의 클라우드포메이션 템플릿에 *env*, *S3UserfilesBucketName*, *DynamoDBPhotosTableArn* 변수를 추가했습니다.

- 사진 처리 함수의 구성에 *ENV*, *THUMBNAIL_WIDTH*, *THUMBNAIL_HEIGHT*, *DYNAMODB_PHOTOS_TABLE_ARN* 환경 변수를 추가했습니다.

- 함수에서 사진을 저장하는 S3 버킷에 읽고 쓰기를 허가하는 *AllPrivsForPhotoAlbums* 라는 IAM 정책을 추가했습니다.

- 함수에서 사진 정보를 수록한 DynamoDB에 읽고 쓰기를 허가하는 *AllPrivsForDynamo* 라는 IAM 정책을 추가하였습니다.

- 함수에서 Amazon Rekognition의 detectLabels API를 사용할 수 있도록 허가하는 *RekognitionDetectLabels* 라는 IAM 정책을 추가하였습니다. 이 정책은 아직 사용하지 않지만, 관련 파일을 작업하는 동안이라 편의상 여기에 추가하였으니, 다음 장에서 AI로 자동으로 사진을 태깅하는 것에 관하여 다룰 때 여기로 돌아와서 정책을 추가하지 않아도 됩니다.

{{% notice warning %}}
AWS Amplify CLI는 클라우드포메이션 템플릿을 생성하여 프로젝트의 클라우드 리소스를 관리합니다. 클라우드포메이션 템플릿은 프로젝트의 모든 인프라 구성을 JSON 이나 또는 YAML 파일 형식의 코드로 지정하여 매우 유용합니다. 이 워크샵에서는 생성된 클라우드포메이션 템플릿의 일부를 계속 편집할 것입니다.
<br/> <br/>

모든 변경 사항을 안전하게 적용할 수는 없고, 수정한 클라우드포메이션 템플릿을 Amplify CLI가 덮어 쓸 수 있음을 주의하십시요. 다만 이 워크샵에서는 우리가 수정한 모든 내용은 Amplify가 덮어 쓰지 않는데, 이는 편집한 리소스를 다시 구성하거나 제거하는 명령을 실행하지 않았기 때문으로, CLI를 이용하여 이미 Amplify로 생성한 리소스를 재구성한다면 이런 경우가 _발생할 수 있다_ 는 것을 기억하는 것이 좋습니다.
{{% /notice %}}