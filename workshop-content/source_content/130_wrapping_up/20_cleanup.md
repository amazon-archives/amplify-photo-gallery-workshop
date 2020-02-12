+++
title = "Cleaning Up"
chapter = false
weight = 20
+++

### Deleting via Amplify

Amplify can do a pretty good job of removing most of the cloud resources we've provisioned for this workshop (just by attempting to delete the CloudFormation nested stack it provisioned). However, it will refuse to delete a few items, which we'll manually take care of as well.

1. **From the photoalbums directory, run:** `amplify delete` and press *Enter* to confirm the deletion.

2. **Wait** several minutes while Amplify deletes the resources it created for us during this workshop.

### Deleting the Cloud9 Workspace

1. Go to your [Cloud9 Environment](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1)

2. Select the environment named **workshop** and pick **Delete**

3. **Type the phrase** 'Delete' into the confirmation box and click **Delete**
