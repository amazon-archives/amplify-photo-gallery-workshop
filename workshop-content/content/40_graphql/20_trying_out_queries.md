+++
title = "Trying Out Some Queries"
chapter = false
weight = 20
+++


**➡️ Open the AWS Console**, browse to AppSync, make sure you're in your chosen region and **click into the photoalbums-master API**. Now we can start poking around with the API.

**➡️ Click Queries** in the sidebar on the left.

![appsync queries](/images/appsync_queries.png?classes=border)

{{% notice info %}}
This area is AWS AppSync's interactive query explorer. We can write queries and mutations here, execute them, and see the results. It's a great way to test things out to make sure our resolvers are working the way we expect.
{{% /notice %}}

### Authenticating to AppSync

{{% notice warning %}}
Before we can issue queries, we'll need to authenticate (because our AppSync API is configured to authenticate users via the Amazon Cognito User Pool we set up when we configured the authentication for our app.
{{% /notice %}}

1. **➡️ Click the Login with User Pools button** at the top of the query editor.

1. ➡️ Look up the value for the **ClientId** field
    1.  In Cloud9, **open photoalbums/src/aws-exports.js**
    2.  **Copy** the value of the **aws_user_pools_web_client_id** property

1. **➡️ Paste** the value into the **ClientId** field

1. **➡️ Enter your credentials** for the user you created when we added authentication

1. **➡️ Click Login**

### Trying out some queries

You should now be able to try out the following mutations and queries. Press the orange 'play' button to execute queries and mutations.

**➡️ Add a new album** by copy/pasting the following and running the query:

    mutation {
        createAlbum(input:{name:"First Album"}) {
            id
            name
        }
    }

**➡️ Add another album** by editing and re-running your createAlbum mutation with another album name:

    mutation {
        createAlbum(input:{name:"Second Album"}) {
            id
            name
        }
    }

**➡️ List all albums** by running this query:

    query {
        listAlbums {
            items {
                id
                name
            }
        }
    }

As you can see, we're able to read and write data through GraphQL queries and mutations and AppSync takes care of reading and persisting data (in this case, to DynamoDB).