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

**➡️ Replace `src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#id5dcbde52fab822d160f65b3e20fef2086fe2291bphotoalbumssrcAppjs"><strong>this content</strong></span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id5dcbde52fab822d160f65b3e20fef2086fe2291bphotoalbumssrcAppjs"></div> <script type="text/template" data-diff-for="diff-id5dcbde52fab822d160f65b3e20fef2086fe2291bphotoalbumssrcAppjs">commit 5dcbde52fab822d160f65b3e20fef2086fe2291b
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Thu Feb 6 11:30:53 2020 +0800

    update frontend for album management

diff --git a/photoalbums/src/App.js b/photoalbums/src/App.js
index 8cbceb0..93eeb3f 100644
--- a/photoalbums/src/App.js
+++ b/photoalbums/src/App.js
@@ -1,24 +1,173 @@
-import React from 'react';
+import React, {useState, useEffect} from 'react';
 
-import Amplify from 'aws-amplify';
-import aws_exports from './aws-exports';
+import Amplify, {Auth} from 'aws-amplify'
+import API, {graphqlOperation} from '@aws-amplify/api'
+import aws_exports from './aws-exports'
 
-import { withAuthenticator } from 'aws-amplify-react';
-import { Header } from 'semantic-ui-react';
+import {withAuthenticator} from 'aws-amplify-react'
+import {Grid, Header, Input, List, Segment} from 'semantic-ui-react'
+
+import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
+
+import * as queries from './graphql/queries'
+import * as mutations from './graphql/mutations'
+import * as subscriptions from './graphql/subscriptions'
 
 Amplify.configure(aws_exports);
 
-function App() {
+function makeComparator(key, order = 'asc') {
+  return (a, b) => {
+    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) 
+      return 0;
+    
+    const aVal = (typeof a[key] === 'string')
+      ? a[key].toUpperCase()
+      : a[key];
+    const bVal = (typeof b[key] === 'string')
+      ? b[key].toUpperCase()
+      : b[key];
+
+    let comparison = 0;
+    if (aVal > bVal) 
+      comparison = 1;
+    if (aVal < bVal) 
+      comparison = -1;
+    
+    return order === 'desc'
+      ? (comparison * -1)
+      : comparison
+  };
+}
+
+const NewAlbum = () => {
+  const [name,
+    setName] = useState('')
+
+  const handleSubmit = async(event) => {
+    event.preventDefault();
+    await API.graphql(graphqlOperation(mutations.createAlbum, {input: {
+        name
+      }}))
+    setName('')
+  }
+
   return (
-    <Header as="h1">
-      Hello World!
-    </Header>
+    <Segment>
+      <Header as='h3'>Add a new album</Header>
+      <Input
+        type='text'
+        placeholder='New Album Name'
+        icon='plus'
+        iconPosition='left'
+        action={{
+        content: 'Create',
+        onClick: handleSubmit
+      }}
+        name='name'
+        value={name}
+        onChange={(e) => setName(e.target.value)}/>
+    </Segment>
+  )
+}
+
+const AlbumsList = () => {
+  const [albums,
+    setAlbums] = useState([])
+
+  useEffect(() => {
+    async function fetchData() {
+      const result = await API.graphql(graphqlOperation(queries.listAlbums, {limit: 999}))
+      setAlbums(result.data.listAlbums.items)
+    }
+    fetchData()
+  }, [])
+
+  useEffect(() => {
+    let subscription
+    async function setupSubscription() {
+      const user = await Auth.currentAuthenticatedUser()
+      subscription = await API.graphql(graphqlOperation(subscriptions.onCreateAlbum, {owner: user.username}))
+      subscription.subscribe({
+        next: (data) => {
+          const album = data.value.data.onCreateAlbum
+          setAlbums(a => a.concat([album].sort(makeComparator('name'))))
+        }
+      })
+    }
+    setupSubscription()
+
+    return () => subscription.unsubscribe();
+  }, [])
+
+  const albumItems = () => {
+    return albums
+      .sort(makeComparator('name'))
+      .map(album => <List.Item key={album.id}>
+        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
+      </List.Item>);
+  }
+
+  return (
+    <Segment>
+      <Header as='h3'>My Albums</Header>
+      <List divided relaxed>
+        {albumItems()}
+      </List>
+    </Segment>
   );
 }
 
+const AlbumDetails = (props) => {
+  const [album,
+    setAlbum] = useState({name: 'Loading...', photos: []})
+
+  useEffect(() => {
+    const loadAlbumInfo = async() => {
+      const results = await API.graphql(graphqlOperation(queries.getAlbum, {id: props.id}))
+      setAlbum(results.data.getAlbum)
+    }
+
+    loadAlbumInfo()
+  }, [props.id])
+
+  return (
+    <Segment>
+      <Header as='h3'>{album.name}</Header>
+      <p>TODO LATER IN WORKSHOP: Allow photo uploads</p>
+      <p>TODO LATER IN WORKSHOP: Show photos for this album</p>
+    </Segment>
+  )
+}
+
+function App() {
+  return (
+    <Router>
+      <Grid padded>
+        <Grid.Column>
+          <Route path="/" exact component={NewAlbum}/>
+          <Route path="/" exact component={AlbumsList}/>
+
+          <Route
+            path="/albums/:albumId"
+            render={() => <div>
+            <NavLink to='/'>Back to Albums list</NavLink>
+          </div>}/>
+          <Route
+            path="/albums/:albumId"
+            render={props => <AlbumDetails id={props.match.params.albumId}/>}/>
+        </Grid.Column>
+      </Grid>
+    </Router>
+  )
+}
+
 export default withAuthenticator(App, {
   includeGreetings: true,
   signUpConfig: {
     hiddenDefaults: ['phone_number']
   }
+<<<<<<< HEAD
 });
+=======
+})
+>>>>>>> f3cfbcb... update frontend for album management
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id5dcbde52fab822d160f65b3e20fef2086fe2291bphotoalbumssrcAppjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">import React, {useState, useEffect} from 'react';

import Amplify, {Auth} from 'aws-amplify'
import API, {graphqlOperation} from '@aws-amplify/api'
import aws_exports from './aws-exports'

import {withAuthenticator} from 'aws-amplify-react'
import {Grid, Header, Input, List, Segment} from 'semantic-ui-react'

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import * as queries from './graphql/queries'
import * as mutations from './graphql/mutations'
import * as subscriptions from './graphql/subscriptions'

Amplify.configure(aws_exports);

function makeComparator(key, order = 'asc') {
  return (a, b) => {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) 
      return 0;
    
    const aVal = (typeof a[key] === 'string')
      ? a[key].toUpperCase()
      : a[key];
    const bVal = (typeof b[key] === 'string')
      ? b[key].toUpperCase()
      : b[key];

    let comparison = 0;
    if (aVal > bVal) 
      comparison = 1;
    if (aVal < bVal) 
      comparison = -1;
    
    return order === 'desc'
      ? (comparison * -1)
      : comparison
  };
}

const NewAlbum = () => {
  const [name,
    setName] = useState('')

  const handleSubmit = async(event) => {
    event.preventDefault();
    await API.graphql(graphqlOperation(mutations.createAlbum, {input: {
        name
      }}))
    setName('')
  }

  return (
    <Segment>
      <Header as='h3'>Add a new album</Header>
      <Input
        type='text'
        placeholder='New Album Name'
        icon='plus'
        iconPosition='left'
        action={{
        content: 'Create',
        onClick: handleSubmit
      }}
        name='name'
        value={name}
        onChange={(e) => setName(e.target.value)}/>
    </Segment>
  )
}

const AlbumsList = () => {
  const [albums,
    setAlbums] = useState([])

  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(graphqlOperation(queries.listAlbums, {limit: 999}))
      setAlbums(result.data.listAlbums.items)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let subscription
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser()
      subscription = await API.graphql(graphqlOperation(subscriptions.onCreateAlbum, {owner: user.username}))
      subscription.subscribe({
        next: (data) => {
          const album = data.value.data.onCreateAlbum
          setAlbums(a => a.concat([album].sort(makeComparator('name'))))
        }
      })
    }
    setupSubscription()

    return () => subscription.unsubscribe();
  }, [])

  const albumItems = () => {
    return albums
      .sort(makeComparator('name'))
      .map(album => <List.Item key={album.id}>
        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
      </List.Item>);
  }

  return (
    <Segment>
      <Header as='h3'>My Albums</Header>
      <List divided relaxed>
        {albumItems()}
      </List>
    </Segment>
  );
}

const AlbumDetails = (props) => {
  const [album,
    setAlbum] = useState({name: 'Loading...', photos: []})

  useEffect(() => {
    const loadAlbumInfo = async() => {
      const results = await API.graphql(graphqlOperation(queries.getAlbum, {id: props.id}))
      setAlbum(results.data.getAlbum)
    }

    loadAlbumInfo()
  }, [props.id])

  return (
    <Segment>
      <Header as='h3'>{album.name}</Header>
      <p>TODO LATER IN WORKSHOP: Allow photo uploads</p>
      <p>TODO LATER IN WORKSHOP: Show photos for this album</p>
    </Segment>
  )
}

function App() {
  return (
    <Router>
      <Grid padded>
        <Grid.Column>
          <Route path="/" exact component={NewAlbum}/>
          <Route path="/" exact component={AlbumsList}/>

          <Route
            path="/albums/:albumId"
            render={() => <div>
            <NavLink to='/'>Back to Albums list</NavLink>
          </div>}/>
          <Route
            path="/albums/:albumId"
            render={props => <AlbumDetails id={props.match.params.albumId}/>}/>
        </Grid.Column>
      </Grid>
    </Router>
  )
}

export default withAuthenticator(App, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
<<<<<<< HEAD
});
=======
})
>>>>>>> f3cfbcb... update frontend for album management

</textarea>
{{< /safehtml >}}

### What we changed in src/App.js

- Imported the *Connect* component from aws-amplify-react

- Imported more presentational components from *semantic-ui-react*

- Imported *API* and *graphqlOperation* from *aws-amplify*

- Imported routing components from *react-router-dom*

- Added *makeComparator* to allow us to sanely sort strings in JS

- Added new components: *NewAlbum*, *AlbumsList*, *AlbumsDetailsLoader*, *AlbumDetails*, *AlbumsListLoader*

- Added GraphQL queries and mutations: *ListAlbums*, *SubscribeToNewAlbums*, *GetAlbum*

- Updated the App component to present different components based on the current URL route

### Try out the app

Check out the app now and try out the new features: 

- View the list of albums

- Create a new album and see it appear in the albums list

- Click into an album to see the beginnings of our Album details view

- When viewing an Album, click 'Back to Albums list' to go home

{{% notice tip %}}
The loading magic here comes from [AWS Amplify's *Connect* component](https://aws-amplify.github.io/docs/js/api#connect) (which we imported from the *aws-amplify-react* package). All we need to do is pass this component a GraphQL query operation in its query prop. It takes care of running that query when the component mounts, and it passes information down to a child function via the data, loading, and errors arguments. We use those values to render appropriately, either showing some loading text or passing the successfully fetched data to our *AlbumsList* component.
{{% /notice %}}

{{% notice info %}}
The *listAlbums* query we're above using passes in a very high limit argument. This is because we can just load all of the albums in one request and sort the albums alphabetically on the client-side (instead of dealing with paginated DynamoDB responses). This keeps the *AlbumsList* code pretty simple, so it's probably worth the trade off in terms of performance or network cost.
{{% /notice %}}

{{% notice info %}}
Also worth noting is how we're leveraging an AppSync real-time subscription to automatically refresh the list of albums whenever a new album is created.
<br/>
<br/>
Our GraphQL schema contains a *Subscription* type with a bunch of subscriptions that were auto-generated back when we had AWS AppSync create the resources (like the DynamoDB table and the AWS AppSync resolvers) for our *Album* type. One of these the _onCreateAlbum_ subscription.
<br/>
<br/>
The _subscription_ and _onSubscriptionMsg_ properties on the _Connect_ component tell it to subscribe to the _onCreateAlbum_ event data and update the data for AlbumsList accordingly. 
<br/>
<br/>
The content for the subscription property looks very similar to what we provided for the query property previously; it just contains a query specifying the subscription we want to listen to and what fields we'd like back when new data arrives. The only slightly tricky bit is that we also need to define a handler function to react to new data from the subscription, and that function needs to return a new set of data that the _Connect_ component will use to refresh our _ListAlbums_ component. This is what we've done above.
{{% /notice %}}
