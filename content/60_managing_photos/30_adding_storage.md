+++
title = "Adding Cloud Storage"
chapter = false
weight = 30
+++

We'll need a place to store all of the photos that get uploaded to our albums. Amazon Simple Storage Service (S3) is a great option for this and Amplify's Storage module makes setting up and working with S3 very easy.

### Configuring and adding storage

First, we'll use the Amplify CLI to enable storage for our app. This will create a bucket on Amazon S3 and set it up with appropriate permissions so that users who are logged in to our app can read from and write to it. We'll also allow guests to read from the bucket, in case we ever want to allow albums to be made public. 

1. **From the photo-albums directory, run** `amplify add storage`

2. **Select 'Content'** at the prompt

3. **Enter values or accept defaults** for the resource category and bucket name

4. **Chose Auth and guest users** when asked who should have access. Configure it so that **authenticated users** have access with **create/update, read, and delete access** (use the spacebar to toggle on/off, the arrow keys to move, and Enter to continue) and **guests** have **read permission**. 

    Here is sample output with responses:

    ```text
    $ amplify add storage


    ? Please select from one of the below mentioned services:
    
    Content (Images, audio, video, etc.)


    ? Please provide a friendly name for your resource that will be used to label this category in the proje
    ct: photoalbumsstorage


    ? Please provide bucket name: <accept the default value>


    ? Who should have access: Auth users only


    ? What kind of access do you want for Authenticated users? 
    ◉ create/update
    ◉ read
    ◉ delete


    ? What kind of access do you want for Guest users? 
    ◯ create/update
    ◉ read
    ◯ delete
    ```

Now we'll have Amplify modify our cloud environment, provisioning the storage resources we just added.

1. **Run** `amplify push` 
2. **Press Enter** to confirm the changes
3. Wait for the provisioning to finish. Adding storage usually only takes a minute or two.

{{% notice info %}}
Above, we're telling Amplify to allow read access for guest users so that if we ever want to allow albums to be made public, we won't need to make any further changes to the way the S3 bucket permissions are configured. However, we won't be making albums publicly readable as part of this workshop.
{{% /notice %}}

{{% notice tip %}}
You can read more about Amplify's Storage module [here](https://aws-amplify.github.io/amplify-js/media/storage_guide).
{{% /notice %}}
