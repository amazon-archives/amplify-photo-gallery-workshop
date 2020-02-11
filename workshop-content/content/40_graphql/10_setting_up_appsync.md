+++
title = "Setting Up AppSync"
chapter = false
weight = 10
+++

Now that we have authenticated users, let's make an API for creating albums. These albums won't have any photos in them just yet, just a name and an association with the username that created them, but it's another clear step toward putting our app together.

{{% notice info %}}
To build our API we'll use [AWS AppSync](https://aws.amazon.com/appsync/), a managed GraphQL service for building data-driven apps. If you're not yet familiar with the basics of GraphQL, you should take a few minutes and check out [https://graphql.github.io/learn/](https://graphql.github.io/learn/) before continuing, or use the site to refer back to when you have questions as you read along.
{{% /notice %}}

![AWS AppSync: Rapid prototyping and development with GraphQL](/images/appsync-logo.png)

### Adding an AWS AppSync API

**➡️ From the photoalbums directory, run** `amplify add api` and respond to the prompts like this:
```text
$ amplify add api 

? Please select from one of the below mentioned services
GraphQL

? Provide API name:
photoalbums

? Choose an authorization type for the API
Amazon Cognito User Pool

? Do you have an annotated GraphQL schema? 
No

? Do you want a guided schema creation? 
Yes

? What best describes your project: 
One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)

? Do you want to edit the schema now? 
Yes

Please manually edit the file created at /home/ec2-user/environment/photoalbums/amplify/backend/api/photoalbums/schema.graphql

? Press enter to continue 
```


### Declaring the GraphQL Schema

Below is a schema that will suit our needs for storing and querying Albums and Photos. 

850e727807851182f33ac5bb4c8843ea29ebfd9f

**➡️ Replace `photoalbums/amplify/backend/api/photoalbums/schema.graphql` with** <span class="clipBtn clipboard" data-clipboard-target="#id850e727807851182f33ac5bb4c8843ea29ebfd9fphotoalbumsamplifybackendapiphotoalbumsschemagraphql"><strong>this content</strong></span> (click the gray button to copy to clipboard).  And, **remember to save the file**.
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id850e727807851182f33ac5bb4c8843ea29ebfd9fphotoalbumsamplifybackendapiphotoalbumsschemagraphql"></div> <script type="text/template" data-diff-for="diff-id850e727807851182f33ac5bb4c8843ea29ebfd9fphotoalbumsamplifybackendapiphotoalbumsschemagraphql">commit 850e727807851182f33ac5bb4c8843ea29ebfd9f
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Thu Feb 6 10:38:37 2020 +0800

    amplify add api and push

diff --git a/photoalbums/amplify/backend/api/photoalbums/schema.graphql b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
new file mode 100644
index 0000000..a9d7fde
--- /dev/null
+++ b/photoalbums/amplify/backend/api/photoalbums/schema.graphql
@@ -0,0 +1,25 @@
+type Album 
+@model 
+@auth(rules: [{allow: owner}]) {
+    id: ID!
+    name: String!
+    photos: [Photo] @connection(keyName: "byAlbum", fields: ["id"])
+}
+
+type Photo 
+@model 
+@key(name: "byAlbum", fields: ["albumId"])
+@auth(rules: [{allow: owner}]) {
+    id: ID!
+    albumId: ID!
+    album: Album @connection(fields: ["albumId"])
+    bucket: String!
+    fullsize: PhotoS3Info!
+    thumbnail: PhotoS3Info!
+}
+
+type PhotoS3Info {
+    key: String!
+    width: Int!
+    height: Int!
+}
\ No newline at end of file
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id850e727807851182f33ac5bb4c8843ea29ebfd9fphotoalbumsamplifybackendapiphotoalbumsschemagraphql" style="position: relative; left: -1000px; width: 1px; height: 1px;">type Album 
@model 
@auth(rules: [{allow: owner}]) {
    id: ID!
    name: String!
    photos: [Photo] @connection(keyName: "byAlbum", fields: ["id"])
}

type Photo 
@model 
@key(name: "byAlbum", fields: ["albumId"])
@auth(rules: [{allow: owner}]) {
    id: ID!
    albumId: ID!
    album: Album @connection(fields: ["albumId"])
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
}
</textarea>
{{< /safehtml >}}

Note: in Cloud9 you can mouse-over the file name in the terminal, click it, and select 'Open'.

1. ➡️ Return to your command prompt and **press Enter once** to continue

1. **➡️ Run** `amplify push` and confirm you'd like to continue with the updates

1. ➡️ When prompted about code generation, **select 'Yes'**, then **choose 'javascript'**, and accept the defaults for the remaining prompts.

1. ➡️ Wait a few minutes while Amplify takes care of provisioning new resources for us.

{{% notice info %}}
At this point, without having to write any code, we now have a GraphQL API that will let us perform CRUDL operations on our Album and Photo data types!
<br/><br/>
But don't worry, the way AWS AppSync is resolving fields into data isn't hidden from us. Each resolver that was automatically generated is available for us to edit as we see fit, and we'll get to that later. For now, let's try out adding some albums and then retrieving them all as a list.
{{% /notice %}}