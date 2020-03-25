+++
title = "Making Photos Searchable"
chapter = false
weight = 20
+++

#### Updating the GraphQL Schema

Now that we are attempting to store labels for each photo, we need to update our GraphQL API to accept this data as part of the input to a `CreatePhoto` mutation and to allow this data to be searchable via queries.

A flexible and very performant approach is to use the Amazon Elasticsearch Service to index our Photos data and handle our search queries. Fortunately, the Amplify CLI makes creating an Amazon Elasticsearch Service endpoint, and connecting it to our app's data, very easy.


**➡️ Replace `photoalbums/amplify/backend/api/photoalbums/schema.graphql` with** ___CLIPBOARD_BUTTON 1957013992344ecb1f1a16456fe6a062fce6bc73:photoalbums/amplify/backend/api/photoalbums/schema.graphql|

**➡️ From the photoalbums directory, run:** `amplify push`.

**➡️ Select 'yes'** when asked if you want to update code for your updated GraphQL API.

**➡️ Select 'yes'** to confirm you're OK with overwriting the Amplify-generated query/mutation/subscription JS files.

➡️ Wait for the update to finish. Creating a new Amazon Elasticsearch Service endpoint can take a while. **This step usually takes 8 to 12 minutes to complete.**

{{% notice note %}}
If you notice any timeout errors after the `amplify push` above, it may be taking longer than usual to provision an Amazon Elasticsearch Service endpoint. Usually just issuing another `amplify push` and waiting a few more minutes will resolve the problem.
{{% /notice %}}

{{% notice tip %}}
You can learn more about Amplify's *@searchable* GraphQL directive in [Amplify's GraphQL Transform documentation](https://aws-amplify.github.io/docs/cli/graphql?sdk=js).
{{% /notice %}}

### What we changed
- Added the *@searchable* directive to the Photo type, which will have Amplify connect Photo data to an Amazon Elasticsearch Service cluster

- Added a new *labels* propery to the *Photo* type so that the labels information added by the Photo Processor function will also be streamed as part of each Photo record into the Elasticsearch Service for us to search on


{{% notice note %}}
You can continue on to the next section while you're waiting for the `amplify push` to complete. 
{{% /notice %}}