+++
title = "Amazon Rekognition 연동하기"
chapter = false
weight = 10
+++

직접 태깅하지 않은 이미지도 검색할 수 있으면 좋겠습니다. 다행이 [Amazon Rekognition](https://aws.amazon.com/rekognition/image-features/) 덕분에 이 기능을 추가하기는 매우 쉽습니다. 사진을 주면 해당 이미지에 적절한 레이블로 응답하는 [DetectLabels API](https://docs.aws.amazon.com/rekognition/latest/dg/API_DetectLabels.html)를 사용할 수 있습니다. 완벽합니다!

{{% notice info %}}
**Amazon Rekognition의 DetectLabels 간략 정리**
<br/><br/>
입력한 이미지를 base64 인코딩한 이미지 바이트열이나 Amazon S3 버킷에 이미지 참조로 전달합니다. AWS CLI로 Amazon Rekognition 작업을 호출하는 경우 이미지 바이트열을 전달하는 기능은 지원하지 않습니다. 이미지는 PNG 또는 JPEG 형식의 파일이어야 합니다.
<br/><br/>
API는 각 개체와 장면과 컨셉에 따라 하나 이상의 레이블을 반환합니다. 각 레이블은 이미지에 포함된 개체의 이름과 신뢰도 수준 정보를 제공합니다. 예를 들어 입력 이미지에 등대, 바다, 바위가 있다고 가정해봅니다. 그 응답에는 각 개체당 1개씩 3개의 모든 레이블을 포함합니다.
<br/><br/>
{Name: lighthouse, Confidence: 98.4629}
<br/>
{Name: rock,Confidence: 79.2097}
<br/>
{Name: sea,Confidence: 75.061}
{{% /notice %}}


#### Rekognition과 사진 처리 람다 연동하기

photo_processor 람다 함수에 Amazon Rekognition을 연동하겠습니다.

**amplify/backend/function/workshopphotoprocessor/src/index.js**를 다음 버전으로 변경합니다.

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

If you're not working in Cloud9, you can follow the instructions on http://sharp.pixelplumbing.com/en/stable/install/#aws-lambda how to install the module and native dependencies.
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

### 바뀐 것들
- Amazon Rekognition API를 이용하기 위해 *AWS.Recognition* 인스턴스를 생성했습니다.

- *Rekognition.detectLabels* 을 이용하여 주어진 S3의 사진을 위한 적절한 레이블의 목록을 돌려주는 *getLabelNames* 함수가 추가되었습니다.

- *getLabelNames* 함수를 이용하여 사진 레이블을 가지고 와서, DynamoDB에 해당 기록과 함께 저장되도록 *processRecord* 함수를 수정했습니다.

사진 처리기 코드는 이제 Amazon Rekognition의 detectLables API를 사용합니다. 그러나 이전 장에서 이 작업에 대한 권한을 이미 추가했기때문에 CloudFormation 템플릿을 다시 갱신할 필요는 없습니다.


### 사진 처리 람다를 재배포하기

**photo-albums 디렉토리에서** `amplify push`를 실행해서 갱신된 버전의 사진 처리 함수를 배포합니다.

배포가 끝나면 새 사진을 앨범에 추가해 봅니다. 그리고 DynamoDB의 PhotoTable에 해당 행을 찾아보아서 새로 업로드한 것에 적절히 레이블이 주어졌는지 확인해 봅니다. 바라기는 해당 사진과 관련있는 레이블을 볼 것입니다.