+++
title = "Deploying our app to S3"
chapter = false
weight = 120
+++

Before we build and publish our app, we should free up some memory on the Cloud9 instance. If you're using a micro Cloud9 instance size, there's a good chance there won't be enough memory available to keep our development web server running and to create a production build.

1. Go to the **terminal** tab that's running the **development webserver** (where you ran *npm start*)

1. Press **Control-C** to interrupt the development webserver and kill it.

The AWS Amplify CLI makes it easy to deploy our app to a publicly accessible bucket on S3.

1. **Run** `amplify hosting add`, select a deployment mode (for this workshop, select 'Development'), and respond to the questions (you can accept the default value of index.html for the index and error doc).
    ```bash
    $ amplify hosting add

    ? Select the environment setup: 

    DEV (S3 only with HTTP)


    ? hosting bucket name 

    Accept the propossed one that looks like photoalbums-19700101010203--hostingbucket


    ? index doc for the website 

    index.html


    ? error doc for the website 

    index.html
    ```


2. **Run** `amplify publish`. This command includes an _amplify push_ but also publishes changes to our hosted app.

3. Wait while Amplify builds a production version of our app and deploys it to the hosting bucket. This process usually takes a minute or two.

After the build and deploy finishes, you'll see a URL for the version of deployed app. Any time you make new changes to the app, just re-run `amplify publish` whenever you want to push a new build out.