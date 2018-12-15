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


#### Integrating Rekognition with the Photo Processor Lambda

Let's add Amazon Rekognition integration in to our photo_processor lambda function.

**Replace amplify/backend/function/workshopphotoprocessor/src/index.js** with the following version:

{{< highlight js "hl_lines=5 24-38 116 121">}}
// photo-albums/amplify/backend/function/workshopphotoprocessor/src/index.js

const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const Rekognition = new AWS.Rekognition();
const DynamoDBDocClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuidv4 = require('uuid/v4');

/*
Note: Sharp requires native extensions to be installed in a way that is compatible
with Amazon Linux (in order to run successfully in a Lambda execution environment).

If you're not working in Cloud9, you can use a docker image
built to mimic AWS Lamda's execution environment to install the module's native dependencies: 
docker run -v "$PWD":/var/task lambci/lambda:build-nodejs8.10 npm install
*/
const Sharp = require('sharp');

// We'll expect these environment variables to be defined when the Lambda function is deployed
const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH, 10);
const THUMBNAIL_HEIGHT = parseInt(process.env.THUMBNAIL_HEIGHT, 10);
const DYNAMODB_PHOTOS_TABLE_NAME = process.env.DYNAMODB_PHOTOS_TABLE_ARN.split('/')[1];

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
    const labelNames = await getLabelNames(bucketName, sizes.fullsize.key);
    const id = uuidv4();
    const item = {
        id: id,
        owner: metadata.owner,
        labels: labelNames,
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

### What we changed
- Created an instance of *AWS.Rekognition* to interact with the Amazon Rekognition API

- Added the *getLabelNames* function to use *Rekognition.detectLabels* to return a list of appropriate labels for a given photo on S3

- Updated the *processPrcord* function to use the *getLabelNames* function to get labels for the photo and include them in the item record it persists to DynamoDB

Our Photo Processor code now uses Amazon Rekognition's detectLabels API. But because we already added permissions for this action in the previous section, we won't need to update the CloudFormation template again.


### Re-deploying the Photo Processor Lambda

**From the photo-albums directory, run:** `amplify push` to deploy an updated version of the Photo Processor function.

After the deploy finishes, try adding a new photo to an album. Then, go look at its row in the PhotoTable in DynamoDB and see if you see a labels property for the new upload. Hopefully you see some relevant labels for the photo!