+++
title = "Integrating Amazon Rekognition"
chapter = false
weight = 10
+++

It would be great if we could find images without having to manually tag them with descriptions of their contents. Luckily, adding this feature is pretty easy thanks to [Amazon Rekognition](https://aws.amazon.com/rekognition/image-features/). We can use the [DetectLabels API](https://docs.aws.amazon.com/rekognition/latest/dg/API_DetectLabels.html) -- if we give it a photo, it will respond with a list of appropriate labels for the image. Perfect!

{{% notice info %}}
**Amazon Rekognition's DetectLabels Quick Summary**
<br/><br/>
You pass the input image as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.
<br/><br/>
For each object, scene, and concept the API returns one or more labels. Each label provides the object name, and the level of confidence that the image contains the object. For example, suppose the input image has a lighthouse, the sea, and a rock. The response includes all three labels, one for each object.
<br/><br/>
{Name: lighthouse, Confidence: 98.4629}
<br/>
{Name: rock,Confidence: 79.2097}
<br/>
{Name: sea,Confidence: 75.061}
{{% /notice %}}


#### Integrating Rekognition with the S3 Trigger Lambda function

Let's add Amazon Rekognition integration in to our S3 Trigger Lambda function.

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/index.js` with** <span class="clipBtn clipboard" data-clipboard-target="#ida8e8e30858c8fb9c532fe80c910f22b895778561photoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-ida8e8e30858c8fb9c532fe80c910f22b895778561photoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs"></div> <script type="text/template" data-diff-for="diff-ida8e8e30858c8fb9c532fe80c910f22b895778561photoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs">commit a8e8e30858c8fb9c532fe80c910f22b895778561
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 16:24:24 2020 +0800

    add rekognition to s3 trigger lambda

diff --git a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
index 796f049..e45879e 100644
--- a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
+++ b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
@@ -11,6 +11,7 @@ require('es6-promise').polyfill();
 require('isomorphic-fetch');
 const AWS = require('aws-sdk');
 const S3 = new AWS.S3({ signatureVersion: 'v4' });
+const Rekognition = new AWS.Rekognition();
 const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
 const AWSAppSyncClient = require('aws-appsync').default;
 const uuidv4 = require('uuid/v4');
@@ -30,6 +31,21 @@ const THUMBNAIL_HEIGHT = parseInt(process.env.THUMBNAIL_HEIGHT || 80, 10);
 
 let client = null
 
+async function getLabelNames(bucketName, key) {
+  let params = {
+    Image: {
+      S3Object: {
+        Bucket: bucketName, 
+        Name: key
+      }
+    }, 
+    MaxLabels: 50, 
+    MinConfidence: 70
+  };
+  const detectionResult = await Rekognition.detectLabels(params).promise();
+  const labelNames = detectionResult.Labels.map((l) => l.Name.toLowerCase()); 
+  return labelNames;
+}
 
 async function storePhotoInfo(item) {
   console.log('storePhotoItem', JSON.stringify(item))
@@ -144,12 +160,15 @@ async function processRecord(record) {
   console.log('resize')
 	const sizes = await resize(originalPhoto.Body, bucketName, key);    
   console.log('sizes', JSON.stringify(sizes))
+  const labelNames = await getLabelNames(bucketName, sizes.fullsize.key);
+  console.log(labelNames, labelNames)
 	const id = uuidv4();
 	const item = {
 		id: id,
 		owner: metadata.owner,
 		albumId: metadata.albumid,
     bucket: bucketName,
+    labels: labelNames,
     thumbnail: {
       width: sizes.thumbnail.width,
       height: sizes.thumbnail.height, 
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="ida8e8e30858c8fb9c532fe80c910f22b895778561photoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiPhotoalbumsGraphQLAPIIdOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIIDOUTPUT
var apiPhotoalbumsGraphQLAPIEndpointOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIENDPOINTOUTPUT

Amplify Params - DO NOT EDIT */// eslint-disable-next-line

require('es6-promise').polyfill();
require('isomorphic-fetch');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const Rekognition = new AWS.Rekognition();
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const uuidv4 = require('uuid/v4');
const gql = require('graphql-tag');

/*
Note: Sharp requires native extensions to be installed in a way that is compatible
with Amazon Linux (in order to run successfully in a Lambda execution environment).

If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
*/
const Sharp = require('sharp');

// We'll expect these environment variables to be defined when the Lambda function is deployed
const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH || 80, 10);
const THUMBNAIL_HEIGHT = parseInt(process.env.THUMBNAIL_HEIGHT || 80, 10);

let client = null

async function getLabelNames(bucketName, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucketName, 
        Name: key
      }
    }, 
    MaxLabels: 50, 
    MinConfidence: 70
  };
  const detectionResult = await Rekognition.detectLabels(params).promise();
  const labelNames = detectionResult.Labels.map((l) => l.Name.toLowerCase()); 
  return labelNames;
}

async function storePhotoInfo(item) {
  console.log('storePhotoItem', JSON.stringify(item))
  const createPhoto = gql`
    mutation CreatePhoto(
      $input: CreatePhotoInput!
      $condition: ModelPhotoConditionInput
    ) {
      createPhoto(input: $input, condition: $condition) {
        id
        albumId
        owner
        bucket
        fullsize {
          key
          width
          height
        }
        thumbnail {
          key
          width
          height
        }
        album {
          id
          name
          owner
        }
      }
    }
  `;

  console.log('trying to createphoto with input', JSON.stringify(item))
	const result = await client.mutate({ 
      mutation: createPhoto,
      variables: { input: item },
      fetchPolicy: 'no-cache'
    })

  console.log('result', JSON.stringify(result))
  return result
  }

function thumbnailKey(keyPrefix, filename) {
	return `${keyPrefix}/resized/${filename}`;
}

function fullsizeKey(keyPrefix, filename) {
	return `${keyPrefix}/fullsize/${filename}`;
}

function makeThumbnail(photo) {
	return Sharp(photo).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).toBuffer();
}

async function resize(photoBody, bucketName, key) {
  const keyPrefix = key.substr(0, key.indexOf('/upload/'))
  const originalPhotoName = key.substr(key.lastIndexOf('/') + 1)
  const originalPhotoDimensions = await Sharp(photoBody).metadata();
  
  const thumbnail = await makeThumbnail(photoBody);

	await Promise.all([
		S3.putObject({
			Body: thumbnail,
			Bucket: bucketName,
			Key: thumbnailKey(keyPrefix, originalPhotoName),
		}).promise(),

		S3.copyObject({
			Bucket: bucketName,
			CopySource: bucketName + '/' + key,
			Key: fullsizeKey(keyPrefix, originalPhotoName),
		}).promise(),
	]);

	await S3.deleteObject({
		Bucket: bucketName,
		Key: key
	}).promise();

	return {
		photoId: originalPhotoName,
		
		thumbnail: {
			key: thumbnailKey(keyPrefix, originalPhotoName),
			width: THUMBNAIL_WIDTH,
			height: THUMBNAIL_HEIGHT
		},

		fullsize: {
			key: fullsizeKey(keyPrefix, originalPhotoName),
			width: originalPhotoDimensions.width,
			height: originalPhotoDimensions.height
		}
	};
};

async function processRecord(record) {
	const bucketName = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log('processRecord', JSON.stringify(record))

  if (record.eventName !== "ObjectCreated:Put") { console.log('Is not a new file'); return; }
  if (! key.includes('upload/')) { console.log('Does not look like an upload from user'); return; }

  const originalPhoto = await S3.getObject({ Bucket: bucketName, Key: key }).promise()
  
	const metadata = originalPhoto.Metadata
  console.log('metadata', JSON.stringify(metadata))
  console.log('resize')
	const sizes = await resize(originalPhoto.Body, bucketName, key);    
  console.log('sizes', JSON.stringify(sizes))
  const labelNames = await getLabelNames(bucketName, sizes.fullsize.key);
  console.log(labelNames, labelNames)
	const id = uuidv4();
	const item = {
		id: id,
		owner: metadata.owner,
		albumId: metadata.albumid,
    bucket: bucketName,
    labels: labelNames,
    thumbnail: {
      width: sizes.thumbnail.width,
      height: sizes.thumbnail.height, 
      key: sizes.thumbnail.key,
    },
    fullsize: {
      width: sizes.fullsize.width,
      height: sizes.fullsize.height,
      key: sizes.fullsize.key,
    }
  }

  console.log(JSON.stringify(metadata), JSON.stringify(sizes), JSON.stringify(item))
	await storePhotoInfo(item);
}


exports.handler = async (event, context, callback) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  client = new AWSAppSyncClient({
    url: process.env.API_PHOTOALBUMS_GRAPHQLAPIENDPOINTOUTPUT,
    region: process.env.REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: AWS.config.credentials
    },
    disableOffline: true
  });
 
	try {
		event.Records.forEach(processRecord);
		callback(null, { status: 'Photo Processed' });
	}
	catch (err) {
		console.error(err);
		callback(err);
	}
};

</textarea>
{{< /safehtml >}}

### What we changed
- Created an instance of *AWS.Rekognition* to interact with the Amazon Rekognition API

- Added the *getLabelNames* function to use *Rekognition.detectLabels* to return a list of appropriate labels for a given photo on S3

- Updated the *processRecord* function to use the *getLabelNames* function to get labels for the photo and include them in the item record it persists to DynamoDB

Our Photo Processor code now uses Amazon Rekognition's detectLabels API. But because we already added permissions for this action in the previous section, we won't need to update the CloudFormation template again.


### Re-deploying the Photo Processor Lambda

**➡️ From the photoalbums directory, run:** `amplify push` to deploy this updated version of the S3 Trigger Lambda function.

After the deploy finishes, our S3 Trigger function is ready to insert `labels` as a new property when it issues a `CreatePhoto` mutation, but the API doesn't yet accept this field in its input. Continue on to the next section to address this.
