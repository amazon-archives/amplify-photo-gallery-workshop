+++
title = "Managing Albums"
chapter = false
weight = 5
+++

At this point, we have a web app that authenticates users and a secure GraphQL API endpoint that lets us create and read Album data. It's time to connect the two together!

{{% notice info %}}
As we saw above, [AWS Amplify](https://aws.github.io/aws-amplify/) is an open source JavaScript library that makes it very easy to integrate a number of cloud services into your web or React Native apps. We'll start by using its [Connect React component](https://aws-amplify.github.io/docs/js/api#connect) to take care of automatically querying our GraphQL API and providing data for our React components to use when rendering.
<br/><br/>
The Amplify CLI has already taken care of making sure that our *src/aws-exports.js* file contains all of the configuration we'll need to pass to the Amplify JS library in order to talk to the AppSync API. All we'll need to do is add some new code to interact with the API.
{{% /notice %}}

Here's what it will look like when we render our list of Albums:

![Rendering a list of albums in our app](/images/app-albums-screen.png?classes=border)

### Updating our App

Let's update our front-end to:
- allow users to create albums
- show a list of albums
- allow users to click into an album to view its details

**➡️ From the photoalbums directory, run** `npm install --save react-router-dom @aws-amplify/api` to **add new dependencies** for routing and specific modules we'll use from Amplify. 

{{% notice note %}}
Usually, we'd create separate files for each of our components, but here we'll just keep everything together so we can see all of the front end code in one place.
{{% /notice %}}

**➡️ Replace `src/App.js` with** ___CLIPBOARD_BUTTON 9740b2f7f2994b689a053d8c9e9ad3c62337ed93:photoalbums/src/App.js|

### What we changed in src/App.js

- Imported more presentational components from *semantic-ui-react*

- Imported *API* and *graphqlOperation* from *aws-amplify*

- Imported routing components from *react-router-dom*

- Added *makeComparator* to allow us to sanely sort strings in JS

- Added new components for creating and listing albums

- Imported GraphQL queries, mutations, and subscriptions for our new components to use

- Updated the App component to present different components based on the current URL route

### Try out the app

Check out the app now and try out the new features: 

- View the list of albums

- Create a new album and see it appear in the albums list

- Click into an album to see the beginnings of our Album details view

- When viewing an Album, click 'Back to Albums list' to go home

{{% notice tip %}}
What makes a lot of this really convenient is that Amplify took care of generating common GraphQL query, mutation, and subscription statements for us, which we imported and used in our new React components. These are just pre-generated GraphQL operations represented as strings that we use to interact with the API that Amplify generated for us based on the `@model` annotations we supplied in the `schema.graphql` file.
{{% /notice %}}

{{% notice info %}}
The *listAlbums* query we're using above passes in a very high limit argument. This is because we can just load all of the albums in one request and sort the albums alphabetically on the client-side (instead of dealing with paginated DynamoDB responses). This keeps the *AlbumsList* code pretty simple, so it's probably worth the trade-off in terms of performance or network cost.
{{% /notice %}}

{{% notice info %}}
Also worth noting is how we're leveraging an AppSync real-time subscription to automatically refresh the list of albums whenever a new album is created.
<br/>
<br/>
Our GraphQL schema contains a *Subscription* type with a bunch of subscriptions that were auto-generated back when we had AWS AppSync create the resources (like the DynamoDB table and the AWS AppSync resolvers) for our *Album* type. One of these is the _onCreateAlbum_ subscription.
<br/>
<br/>
The content for the subscription property looks very similar to what we provided for the query property previously; it just contains a query specifying the subscription we want to listen to and what fields we'd like back when new data arrives. The only slightly tricky bit is that we also need to define a handler function to react to new data from the subscription, which is what we use to refresh our _AlbumsList_ component with new data from the backend. This is what we've done above.
{{% /notice %}}
