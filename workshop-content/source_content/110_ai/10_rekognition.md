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

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/index.js` with** ___CLIPBOARD_BUTTON a8e8e30858c8fb9c532fe80c910f22b895778561:photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js|

### What we changed
- Created an instance of *AWS.Rekognition* to interact with the Amazon Rekognition API

- Added the *getLabelNames* function to use *Rekognition.detectLabels* to return a list of appropriate labels for a given photo on S3

- Updated the *processRecord* function to use the *getLabelNames* function to get labels for the photo and include them in the item record it persists to DynamoDB

Our Photo Processor code now uses Amazon Rekognition's detectLabels API. But because we already added permissions for this action in the previous section, we won't need to update the CloudFormation template again.


### Re-deploying the Photo Processor Lambda

**➡️ From the photoalbums directory, run:** `amplify push` to deploy this updated version of the S3 Trigger Lambda function.

After the deploy finishes, our S3 Trigger function is ready to insert `labels` as a new property when it issues a `CreatePhoto` mutation, but the API doesn't yet accept this field in its input. Continue on to the next section to address this.
