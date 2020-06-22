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

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/index.js` with** ___CLIPBOARD_BUTTON 260bdddb1669b10e2e1011a5ddaaaf036e091b0d:photoalbums/amplify/backend/function/S3Triggerb18990d7/src/index.js|

The JavaScript code we just pasted to implement our Lambda function has some dependencies. In standard JS fashion, we'll need to update the code's `package.json` file accordingly.

**➡️ Replace `photoalbums/amplify/backend/function/S3Triggerxxxxxxx/src/package.json` with** ___CLIPBOARD_BUTTON 260bdddb1669b10e2e1011a5ddaaaf036e091b0d:photoalbums/amplify/backend/function/S3Triggerb18990d7/src/package.json|

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

**➡️ Replace `photoalbums/amplify/backend/api/photoalbums/schema.graphql` with** ___CLIPBOARD_BUTTON 260bdddb1669b10e2e1011a5ddaaaf036e091b0d:photoalbums/amplify/backend/api/photoalbums/schema.graphql|


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
