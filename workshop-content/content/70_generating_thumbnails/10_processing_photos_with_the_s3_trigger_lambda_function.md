+++
title = "Processing photos with the S3 Trigger Lambda function"
chapter = false
weight = 10
+++

Remember the storage upload trigger Lambda function we created earlier? Now it's time to modify it so it can resize our uploded photos into thumbnails and issue CreatePhoto mutations to our API to associate the uploaded photo data with the appropriate album and user.


{{% notice info %}}
AWS Lambda lets you run code without provisioning or managing servers. Instead, you simply provide the function code you want to execute and configure one or more events to trigger the code's execution. When your Lambda function runs, you only pay for the compute time you consume, and AWS takes care of everything required to scale your code with high availability. Learn more at [https://aws.amazon.com/lambda/](https://aws.amazon.com/lambda/).
{{% /notice %}}

{{% notice warning %}}
The instructions below use the text _S3Triggerxxxxxxx_ to indicate a pattern in your folders and files that you'll need to look for.
<br/><br/>
**The folders and files are not actually called S3Triggerxxxxxxx** but rather something like _S3Trigger1a2b3c4_ or similar, so please look
in your filesystem to find the appropriate files. Hopefully it will be pretty obvious as you look for the files; there should only be
one match for each of the items mentioned below.
{{% /notice %}}


First, we'll paste in the code to implement resizing photos and associating them with their album and owner.

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/index.js` with** <span class="clipBtn clipboard" data-clipboard-target="#id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs"></div> <script type="text/template" data-diff-for="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs">commit 260bdddb1669b10e2e1011a5ddaaaf036e091b0d
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 12:26:26 2020 +0800

    update trigger function code and schema to handle photo uploads

diff --git a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
index 80d7812..796f049 100644
--- a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
+++ b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js
@@ -6,11 +6,186 @@ var apiPhotoalbumsGraphQLAPIIdOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIIDO
 var apiPhotoalbumsGraphQLAPIEndpointOutput = process.env.API_PHOTOALBUMS_GRAPHQLAPIENDPOINTOUTPUT
 
 Amplify Params - DO NOT EDIT */// eslint-disable-next-line
-exports.handler = function(event, context) {
+
+require('es6-promise').polyfill();
+require('isomorphic-fetch');
+const AWS = require('aws-sdk');
+const S3 = new AWS.S3({ signatureVersion: 'v4' });
+const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
+const AWSAppSyncClient = require('aws-appsync').default;
+const uuidv4 = require('uuid/v4');
+const gql = require('graphql-tag');
+
+/*
+Note: Sharp requires native extensions to be installed in a way that is compatible
+with Amazon Linux (in order to run successfully in a Lambda execution environment).
+
+If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
+*/
+const Sharp = require('sharp');
+
+// We'll expect these environment variables to be defined when the Lambda function is deployed
+const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH || 80, 10);
+const THUMBNAIL_HEIGHT = parseInt(process.env.THUMBNAIL_HEIGHT || 80, 10);
+
+let client = null
+
+
+async function storePhotoInfo(item) {
+  console.log('storePhotoItem', JSON.stringify(item))
+  const createPhoto = gql`
+    mutation CreatePhoto(
+      $input: CreatePhotoInput!
+      $condition: ModelPhotoConditionInput
+    ) {
+      createPhoto(input: $input, condition: $condition) {
+        id
+        albumId
+        owner
+        bucket
+        fullsize {
+          key
+          width
+          height
+        }
+        thumbnail {
+          key
+          width
+          height
+        }
+        album {
+          id
+          name
+          owner
+        }
+      }
+    }
+  `;
+
+  console.log('trying to createphoto with input', JSON.stringify(item))
+	const result = await client.mutate({ 
+      mutation: createPhoto,
+      variables: { input: item },
+      fetchPolicy: 'no-cache'
+    })
+
+  console.log('result', JSON.stringify(result))
+  return result
+  }
+
+function thumbnailKey(keyPrefix, filename) {
+	return `${keyPrefix}/resized/${filename}`;
+}
+
+function fullsizeKey(keyPrefix, filename) {
+	return `${keyPrefix}/fullsize/${filename}`;
+}
+
+function makeThumbnail(photo) {
+	return Sharp(photo).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).toBuffer();
+}
+
+async function resize(photoBody, bucketName, key) {
+  const keyPrefix = key.substr(0, key.indexOf('/upload/'))
+  const originalPhotoName = key.substr(key.lastIndexOf('/') + 1)
+  const originalPhotoDimensions = await Sharp(photoBody).metadata();
+  
+  const thumbnail = await makeThumbnail(photoBody);
+
+	await Promise.all([
+		S3.putObject({
+			Body: thumbnail,
+			Bucket: bucketName,
+			Key: thumbnailKey(keyPrefix, originalPhotoName),
+		}).promise(),
+
+		S3.copyObject({
+			Bucket: bucketName,
+			CopySource: bucketName + '/' + key,
+			Key: fullsizeKey(keyPrefix, originalPhotoName),
+		}).promise(),
+	]);
+
+	await S3.deleteObject({
+		Bucket: bucketName,
+		Key: key
+	}).promise();
+
+	return {
+		photoId: originalPhotoName,
+		
+		thumbnail: {
+			key: thumbnailKey(keyPrefix, originalPhotoName),
+			width: THUMBNAIL_WIDTH,
+			height: THUMBNAIL_HEIGHT
+		},
+
+		fullsize: {
+			key: fullsizeKey(keyPrefix, originalPhotoName),
+			width: originalPhotoDimensions.width,
+			height: originalPhotoDimensions.height
+		}
+	};
+};
+
+async function processRecord(record) {
+	const bucketName = record.s3.bucket.name;
+  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
+
+  console.log('processRecord', JSON.stringify(record))
+
+  if (record.eventName !== "ObjectCreated:Put") { console.log('Is not a new file'); return; }
+  if (! key.includes('upload/')) { console.log('Does not look like an upload from user'); return; }
+
+  const originalPhoto = await S3.getObject({ Bucket: bucketName, Key: key }).promise()
+  
+	const metadata = originalPhoto.Metadata
+  console.log('metadata', JSON.stringify(metadata))
+  console.log('resize')
+	const sizes = await resize(originalPhoto.Body, bucketName, key);    
+  console.log('sizes', JSON.stringify(sizes))
+	const id = uuidv4();
+	const item = {
+		id: id,
+		owner: metadata.owner,
+		albumId: metadata.albumid,
+    bucket: bucketName,
+    thumbnail: {
+      width: sizes.thumbnail.width,
+      height: sizes.thumbnail.height, 
+      key: sizes.thumbnail.key,
+    },
+    fullsize: {
+      width: sizes.fullsize.width,
+      height: sizes.fullsize.height,
+      key: sizes.fullsize.key,
+    }
+  }
+
+  console.log(JSON.stringify(metadata), JSON.stringify(sizes), JSON.stringify(item))
+	await storePhotoInfo(item);
+}
+
+
+exports.handler = async (event, context, callback) => {
   console.log('Received S3 event:', JSON.stringify(event, null, 2));
-  // Get the object from the event and show its content type
-  const bucket = event.Records[0].s3.bucket.name; //eslint-disable-line
-  const key = event.Records[0].s3.object.key; //eslint-disable-line
-  console.log(`Bucket: ${bucket}`, `Key: ${key}`);
-  context.done(null, 'Successfully processed S3 event'); // SUCCESS with message
+
+  client = new AWSAppSyncClient({
+    url: process.env.API_PHOTOALBUMS_GRAPHQLAPIENDPOINTOUTPUT,
+    region: process.env.REGION,
+    auth: {
+      type: AUTH_TYPE.AWS_IAM,
+      credentials: AWS.config.credentials
+    },
+    disableOffline: true
+  });
+ 
+	try {
+		event.Records.forEach(processRecord);
+		callback(null, { status: 'Photo Processed' });
+	}
+	catch (err) {
+		console.error(err);
+		callback(err);
+	}
 };
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcindexjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">/* Amplify Params - DO NOT EDIT
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
	const id = uuidv4();
	const item = {
		id: id,
		owner: metadata.owner,
		albumId: metadata.albumid,
    bucket: bucketName,
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

The JavaScript code we just pasted to implement our Lambda function has some dependencies. In standard JS fashion, we'll need to update the code's `package.json` file accordingly.

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/package.json` with** <span class="clipBtn clipboard" data-clipboard-target="#id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcpackagejson">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcpackagejson"></div> <script type="text/template" data-diff-for="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcpackagejson">commit 260bdddb1669b10e2e1011a5ddaaaf036e091b0d
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 12:26:26 2020 +0800

    update trigger function code and schema to handle photo uploads

diff --git a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/package.json b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/package.json
index 1cf57e6..74d2f66 100644
--- a/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/package.json
+++ b/photoalbums/amplify/backend/function/S3Triggerb18990d7/src/package.json
@@ -1,7 +1,14 @@
 {
-  "name": "S3Triggerb18990d7",
-  "version": "2.0.0",
-  "description": "Lambda function generated by Amplify",
-  "main": "index.js",
-  "license": "Apache-2.0"
+    "name": "S3TriggerPhotoProcessor",
+    "version": "1.0.0",
+    "description": "The photo uploads processor",
+    "main": "index.js",
+    "dependencies": {
+        "aws-appsync": "^3.0.2",
+        "es6-promise": "^4.2.8",
+        "graphql-tag": "^2.10.1",
+        "isomorphic-fetch": "^2.2.1",
+        "sharp": "^0.24.0",
+        "uuid": "^3.3.2"
+    }
 }
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendfunctionS3Triggerb18990d7srcpackagejson" style="position: relative; left: -1000px; width: 1px; height: 1px;">{
    "name": "S3TriggerPhotoProcessor",
    "version": "1.0.0",
    "description": "The photo uploads processor",
    "main": "index.js",
    "dependencies": {
        "aws-appsync": "^3.0.2",
        "es6-promise": "^4.2.8",
        "graphql-tag": "^2.10.1",
        "isomorphic-fetch": "^2.2.1",
        "sharp": "^0.24.0",
        "uuid": "^3.3.2"
    }
}

</textarea>
{{< /safehtml >}}

With these steps done, our Lambda function's code is ready to go, but we'll have to make a few more changes to how things are configured before it will work. When Amplify first created our S3 Trigger function to handle our uploads, it created an AWS Lambda function with Identity and Access Management permissions that would let it access files in the S3 bucket, but by default it isn't able to talk to our API. Let's have Amplify re-configure the function so that it has permissions to talk to our API as well.

**➡️ From the `photoalbums` directory, run:** `amplify update function`
1. **Select S3Triggerxxxxxxx**

2. **Select Yes** to update the permissions granted to this Lambda function

3. **Select `api`** and press Enter. (Use the arrow keys to move down to `api` and press Space to toggle the setting.)

4. **Toggle all of the options on** and press Enter.  (You can press `a` to easily toggle them all on.)

5. **Select no** when asked if yu want to edit the local Lambda function. (We've already updated the code.)


Similarly, back when we first configured our AppSync GraphQL API, we configured it to authenticate requests using an Amazon Cognito User Pool so that only the users who authenticated to our web app front end would be able to communicate with the API. Now that we have a server-side Lambda function that will run whenever a new photo gets uploaded to an album, we'll also want that function to be able to communicate with our API. Even though we re-configured our S3 trigger function above, that only took care of specifying that the Lambda function had permissions to communicate with the API via AWS's Identity and Access Management authentication. We still need to configure the API to allow clients to authenticate via IAM as an secondary authentication mechanism. To make this happen, we'll just ask Amplify to re-configure our API to use multiple authentication methods.

**➡️ From the `photoalbums` directory, run:** `amplify update api`

1. **Select GraphQL** 

2. **Select Amazon Cognito User Pool** as the default authorization type for the API.  (This keeps it the same as it was before. We'll add another authorization type in a moment.)

3. **Select 'Yes, I want to make some additional changes.'** to configure advanced settings for the API

4. **Select 'Yes'** to configure additional auth types.

5. **Toggle on IAM** and press Enter.

6. **Select 'No'** when asked if you want to configure conflict detection.



This takes care of enabling IAM authorization as a secondary option for our API, but by default it will still authenticate all requests via its configured default authoriziation method: Amazon Cognito User Pools. To let the S3 Trigger Lambda function communicate with the API via IAM, we can configure specific data types or queries/mutations/subscriptions to authenticate with IAM as an additional authorization method via Amplify's GraphQL Transform directives.

**➡️ Replace `photoalbums/amplify/backend/api/photoalbums/schema.graphql` with** <span class="clipBtn clipboard" data-clipboard-target="#id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendapiphotoalbumsschemagraphql">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendapiphotoalbumsschemagraphql"></div> <script type="text/template" data-diff-for="diff-id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendapiphotoalbumsschemagraphql">commit 260bdddb1669b10e2e1011a5ddaaaf036e091b0d
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 12:26:26 2020 +0800

    update trigger function code and schema to handle photo uploads

diff --git a/photoalbums/amplify/backend/api/photoalbums/schema.graphql b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
index 06044a4..75194c1 100644
--- a/photoalbums/amplify/backend/api/photoalbums/schema.graphql
+++ b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
@@ -1,6 +1,9 @@
 type Album 
 @model 
-@auth(rules: [{allow: owner}]) {
+@auth(rules: [
+  {allow: owner},
+  {allow: private, provider: iam}
+]) {
     id: ID!
     name: String!
     photos: [Photo] @connection(keyName: "byAlbum", fields: ["id"])
@@ -9,7 +12,10 @@ type Album
 type Photo 
 @model 
 @key(name: "byAlbum", fields: ["albumId"], queryField: "listPhotosByAlbum")
-@auth(rules: [{allow: owner}]) {
+@auth(rules: [
+  {allow: owner},
+  {allow: private, provider: iam}
+]) {
     id: ID!
     albumId: ID!
     album: Album @connection(fields: ["albumId"])
@@ -22,4 +28,19 @@ type PhotoS3Info {
     key: String!
     width: Int!
     height: Int!
-}
\ No newline at end of file
+}
+
+input CreatePhotoInput {
+	id: ID
+    owner: String
+	albumId: ID!
+	bucket: String!
+	fullsize: PhotoS3InfoInput!
+	thumbnail: PhotoS3InfoInput!
+}
+
+input PhotoS3InfoInput {
+	key: String!
+	width: Int!
+	height: Int!
+}
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id260bdddb1669b10e2e1011a5ddaaaf036e091b0dphotoalbumsamplifybackendapiphotoalbumsschemagraphql" style="position: relative; left: -1000px; width: 1px; height: 1px;">type Album 
@model 
@auth(rules: [
  {allow: owner},
  {allow: private, provider: iam}
]) {
    id: ID!
    name: String!
    photos: [Photo] @connection(keyName: "byAlbum", fields: ["id"])
}

type Photo 
@model 
@key(name: "byAlbum", fields: ["albumId"], queryField: "listPhotosByAlbum")
@auth(rules: [
  {allow: owner},
  {allow: private, provider: iam}
]) {
    id: ID!
    albumId: ID!
    album: Album @connection(fields: ["albumId"])
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
}

input CreatePhotoInput {
	id: ID
    owner: String
	albumId: ID!
	bucket: String!
	fullsize: PhotoS3InfoInput!
	thumbnail: PhotoS3InfoInput!
}

input PhotoS3InfoInput {
	key: String!
	width: Int!
	height: Int!
}

</textarea>
{{< /safehtml >}}


After we re-configured the API and the Lambda function's permissions above, the AWS Amplify CLI took care of re-generating CloudFormation templates to effect our desired changes. However, a little bit later in the workshop, we're going to want our S3 trigger Lambda function to be able to call out to another AWS service called Amazon Rekognition (to do automatic label detection in our photos). We'll take care of granting this additional privilege to the Lambda function now. 

Instead of having to do these edits by hand, here's a helpful script you can just paste and run in the terminal.

**➡️ From the `photoalbums` directory, run:**

```bash
# Figure out what the S3 Trigger name is
S3_TRIGGER_NAME=$(jq -r '.function | to_entries[] | .key' amplify/backend/amplify-meta.json)

# Insert another IAM policy to allow the lambda function to call rekognition:detectLabels
cat << EOF > rekognition_policy_for_s3_trigger
        "RekognitionPolicy": {
            "DependsOn": [
                "LambdaExecutionRole"
            ],
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyName": "rekognition-detect-labels",
                "Roles": [{
                    "Ref": "LambdaExecutionRole"
                }],
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "rekognition:detectLabels"
                        ],
                        "Resource": "*"
                    }]
                }
            }
        },
EOF
TARGET_FILE="amplify/backend/function/$S3_TRIGGER_NAME/$S3_TRIGGER_NAME-cloudformation-template.json"
LINE=$(grep -n 'AmplifyResourcesPolicy' $TARGET_FILE | cut -d ":" -f 1)
{ head -n $(($LINE-1)) $TARGET_FILE; cat rekognition_policy_for_s3_trigger; tail -n +$LINE $TARGET_FILE; } > updated_s3_trigger_cf
rm $TARGET_FILE; mv updated_s3_trigger_cf $TARGET_FILE

# Rename the amplify-generated policy name in the trigger function cf template to prevent conflicts
sed -i -e "s/amplify-lambda-execution-policy/amplify-lambda-execution-policy-api/" $TARGET_FILE

# Rename the amplify-generated policy name in the s3 cf template to prevent conflicts
STORAGE_NAME=$(jq -r '.storage | to_entries[] | .key' amplify/backend/amplify-meta.json)
sed -i -e "s/amplify-lambda-execution-policy/amplify-lambda-execution-policy-storage/" amplify/backend/storage/$STORAGE_NAME/s3-cloudformation-template.json
```

Finally, we're ready to push these updates to our cloud environment.

**➡️ From the photoalbums directory, run:** `amplify push` and press Enter to confirm the changes.

**➡️ Select No** when asked if you want to update code for your updated GraphQL API. (None of our changes result in the need for re-generated query/mutation/subsription JS files.)

➡️ Wait for the deploy to finish. This step usually only takes about a minute or two.

### What we changed
- Created a Lambda function that will receive records describing each photo that gets uploaded to our S3 bucket. For each photo, it creates a thumbnail and then stores the S3 paths for the fullsize and thumbnail photos directly into the API using a CreatePhoto mutation.

- Added a *RekognitionDetectLabels* IAM policy to grant the function's role permission to use the detectLabels API from Amazon Rekognition. This policy isn't used yet, but we're going to add it here for convenience while we're working with this file so we won't need to come back and add it when we get to the next section that involves automatically tagging our photos with AI.

- Did a small bit of role naming string surgery in the Amplify-generated CloudFormation templates to ensure that the generated IAM policies don't have a naming conflict.

{{% notice warning %}}
The AWS Amplify CLI manages the cloud resources in our project by generating CloudFormation templates for us. CloudFormation templates are very helpful, because they specify all of our project's infrastrucutre as code in the form of JSON and/or YAML files.
<br/> <br/>
Beware that not all manual edits to Amplify-generated CF templateds are safe to make, and the Amplify CLI may overwrite edits you make in some CloudFormation templates. All of the changes we make in this workshop will persist and won't get overwritten by Amplify because we're not issuing any commands to re-configure or remove any of the resources we're editing, but it's good to remember that this sort of thing _can_ happen if you attempt to use the CLI to re-configure a resource you've already generated with Amplify.
{{% /notice %}}

### Try uploading another photo

With these changes completed, we should be able to upload a photo and see our Photo Processor function execute automatically. Try uploading a photo to an album, wait a few moments and see if your new photo shows up (you might need to refresh to see it). If you see a photo, it means that our Photo Processor function was automatically triggered by the upload, it created a thumbnail, persisted this info through our AppSync GraphQL API.
