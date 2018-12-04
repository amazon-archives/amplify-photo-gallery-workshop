+++
title = "Cleaning Up"
chapter = false
weight = 20
+++

### Deleting via Amplify

Amplify can do a pretty good job of removing most of the cloud resources we've provisioned for this workshop (just by attempting to delete the CloudFormation nested stack it provisioned). However, it will refuse to delete a few items, which we'll manually take care of as well.

1. **From the photo-albums directory, run:** `amplify delete` and press *Enter* to confirm the deletion.

2. **Wait** a few minutes while Amplify deletes most of our resources.

### A small bit of manual cleanup

At this point, if you open the [CloudFormation stacks console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks) and click on the various stacks that show a status of 'DELETE FAILED', you can see what failed to delete and why.

The Authenticated users IAM role failed to delete because it won't delete while there were still policies associated with it when CloudFormation tried to delete it.  However, at this point, all the policies should now be deleted, so another attempt at deleting the stack should succeed.

1. **Select our stack** that failed to delete

2. **Click Actions**

3. Select **Delete Stack**

4. Leave the Auth Role **un-checked** and click **Yes, Delete**

5. Wait a moment and see if the delete succeeds. If not, you can always go to the [IAM Roles console](https://console.aws.amazon.com/iam/home?#/roles), search for the role (it will start with 'photoalbums'), then select and delete it.

The S3 Buckets that Amplify created will not be automatically deleted. To delete these buckets:

1. Open the [S3 console](https://s3.console.aws.amazon.com/s3/home?region=us-east-1) 

2. Click the **Date created** column to sort the buckets with the newest ones on top

3. For each _photoalbums*_ bucket, click it's row (not the name itself), click the **Delete bucket** button, then copy/paste the bucket name to confirm the deletion.


### Deleting the Cloud9 Workspace

1. Go to your [Cloud9 Environment](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1)

2. Select the environment named **workshop** and pick **Delete**

3. **Type the phrase** 'Delete' into the confirmation box and click **Delete**
