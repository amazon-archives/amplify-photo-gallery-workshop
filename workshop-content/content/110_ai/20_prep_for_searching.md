+++
title = "Making Photos Searchable"
chapter = false
weight = 20
+++

<div style="text-align: left; border: 2px solid red; background-color: #FFDDDD; padding: 20px; font-size: 130%;">
<strong>Attention</strong>
<p style="text-align: left">
  Due to an AWS Lambda runtime environment change, this part of the workshop will not work without performing some manual work to update the generated Lambda function to use a new Lambda Layer. We recommend you skip this section for now. More information is available here:
   <a href="https://github.com/aws-amplify/amplify-cli/issues/2385#issuecomment-534359510">https://github.com/aws-amplify/amplify-cli/issues/2385#issuecomment-534359510</a>
</p>
</div>

#### Updating the GraphQL Schema

Now that we are storing labels for each photo, we're ready to move on and expose this data via our AppSync API.

While it's possible to perform some level of searching via DynamoDB Query operations, a more flexible and performant approach is to use the Amazon Elasticsearch Service to index data and handle our search queries. Fortunately, the Amplify CLI makes creating an Amazon Elasticsearch Service endpoint, and connecting it to our app's data, very easy.


1. **Replace /photoalbums/amplify/backend/api/photoalbums/schema.graphql** with the following:
{{< highlight graphql "hl_lines=9 15">}}
# amplify/backend/api/photoalbums/schema.graphql

type Album @model @auth(rules: [{allow: owner}]) {
    id: ID!
    name: String!
    photos: [Photo] @connection(name: "AlbumPhotos")
}

type Photo @model @auth(rules: [{allow: owner}]) @searchable {
    id: ID!
    album: Album @connection(name: "AlbumPhotos")
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
    labels: [String!]
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
}
{{< /highlight >}}

2. **From the photoalbums directory, run:** `amplify push` to provision our new resources.

3. Wait for the update to finish. Creating a new Amazon Elasticsearch Service endpoint can take several minutes. **This step usually takes 8 to 12 minutes to complete.**

{{% notice tip %}}
You can learn more about Amplify's *@searchable* GraphQL directive in [Amplify's GraphQL Transform documentation](https://aws-amplify.github.io/docs/cli/graphql?sdk=js).
{{% /notice %}}

### What we changed
- Added the *@searchable* directive to the Photo type, which will have Amplify connect Photo data to an Amazon Elasticsearch Service cluster

- Added a new *labels* propery to the *Photo* type so that the labels information added by the Photo Processor function will also be streamed as part of each Photo record into the Elasticsearch Service for us to search on


{{% notice note %}}
You can continue on to the next section while you're waiting for the `amplify push` to complete. 
{{% /notice %}}