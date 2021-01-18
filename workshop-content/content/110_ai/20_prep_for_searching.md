+++
title = "Making Photos Searchable"
chapter = false
weight = 20
+++

#### Updating the GraphQL Schema

Now that we are attempting to store labels for each photo, we need to update our GraphQL API to accept this data as part of the input to a `CreatePhoto` mutation and to allow this data to be searchable via queries.

A flexible and very performant approach is to use the Amazon Elasticsearch Service to index our Photos data and handle our search queries. Fortunately, the Amplify CLI makes creating an Amazon Elasticsearch Service endpoint, and connecting it to our app's data, very easy.


**➡️ Replace `photoalbums/amplify/backend/api/photoalbums/schema.graphql` with** <span class="clipBtn clipboard" data-clipboard-target="#id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumsamplifybackendapiphotoalbumsschemagraphql">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumsamplifybackendapiphotoalbumsschemagraphql"></div> <script type="text/template" data-diff-for="diff-id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumsamplifybackendapiphotoalbumsschemagraphql">commit 1957013992344ecb1f1a16456fe6a062fce6bc73
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 18:28:08 2020 +0800

    update graphql schema for search and frontend

diff --git a/photoalbums/amplify/backend/api/photoalbums/schema.graphql b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
index 75194c1..aa58931 100644
--- a/photoalbums/amplify/backend/api/photoalbums/schema.graphql
+++ b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
@@ -15,13 +15,15 @@ type Photo
 @auth(rules: [
   {allow: owner},
   {allow: private, provider: iam}
-]) {
+])
+@searchable {
     id: ID!
     albumId: ID!
     album: Album @connection(fields: ["albumId"])
     bucket: String!
     fullsize: PhotoS3Info!
     thumbnail: PhotoS3Info!
+    labels: [String]
 }
 
 type PhotoS3Info {
@@ -37,6 +39,7 @@ input CreatePhotoInput {
 	bucket: String!
 	fullsize: PhotoS3InfoInput!
 	thumbnail: PhotoS3InfoInput!
+  labels: [String]
 }
 
 input PhotoS3InfoInput {
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumsamplifybackendapiphotoalbumsschemagraphql" style="position: relative; left: -1000px; width: 1px; height: 1px;">type Album 
@model 
@auth(rules: [
  {allow: owner},
  {allow: private, provider: iam}
]) {
    id: ID!
    name: String!
    photos: [Photo] @connection(keyName: "byAlbum", fields: ["id"])
}

type Photo 
@model 
@key(name: "byAlbum", fields: ["albumId"], queryField: "listPhotosByAlbum")
@auth(rules: [
  {allow: owner},
  {allow: private, provider: iam}
])
@searchable {
    id: ID!
    albumId: ID!
    album: Album @connection(fields: ["albumId"])
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
    labels: [String]
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
}

input CreatePhotoInput {
	id: ID
    owner: String
	albumId: ID!
	bucket: String!
	fullsize: PhotoS3InfoInput!
	thumbnail: PhotoS3InfoInput!
  labels: [String]
}

input PhotoS3InfoInput {
	key: String!
	width: Int!
	height: Int!
}

</textarea>
{{< /safehtml >}}

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